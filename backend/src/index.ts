import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

const app = express()
const PORT = 3002
const JWT_SECRET = 'secretkey'

app.use(cors())
app.use(express.json())

let db: any

async function initDB() {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  })

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      bio TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      status TEXT DEFAULT 'offline',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.exec(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      friend_id INTEGER,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, friend_id)
    )
  `)

  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER,
      receiver_id INTEGER,
      text TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.exec(`
    CREATE TABLE IF NOT EXISTS post_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      user_id INTEGER,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  console.log('✅ База данных готова')
}

initDB()

const auth = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Нет токена' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await db.get('SELECT id, username, email, bio, avatar, status FROM users WHERE id = ?', [decoded.userId])
    if (!user) return res.status(401).json({ error: 'Пользователь не найден' })
    req.user = user
    req.userId = user.id
    next()
  } catch {
    res.status(401).json({ error: 'Неверный токен' })
  }
}

// Регистрация
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body
  const existing = await db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email])
  if (existing) return res.status(400).json({ error: 'Пользователь уже существует' })
  
  const hash = await bcrypt.hash(password, 10)
  const result = await db.run('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, hash])
  const user = await db.get('SELECT id, username, email, bio, avatar, status FROM users WHERE id = ?', [result.lastID])
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ user, token })
})

// Вход
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body
  const user = await db.get('SELECT * FROM users WHERE username = ?', [username])
  if (!user) return res.status(401).json({ error: 'Неверный логин или пароль' })
  
  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return res.status(401).json({ error: 'Неверный логин или пароль' })
  
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ user: { id: user.id, username: user.username, email: user.email, bio: user.bio, avatar: user.avatar, status: user.status }, token })
})

// Поиск пользователей
app.get('/api/users/search', auth, async (req: any, res) => {
  const { q } = req.query
  const users = await db.all('SELECT id, username, email, avatar, status FROM users WHERE username LIKE ? AND id != ? LIMIT 20', [`%${q}%`, req.userId])
  res.json(users)
})

// Отправить заявку
app.post('/api/friends/request', auth, async (req: any, res) => {
  const { toId } = req.body
  const existing = await db.get('SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)', [req.userId, toId, toId, req.userId])
  if (existing) return res.status(400).json({ error: 'Заявка уже отправлена' })
  
  await db.run('INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)', [req.userId, toId, 'pending'])
  const io = req.app.get('io')
  const fromUser = await db.get('SELECT username FROM users WHERE id = ?', [req.userId])
  io.to(`user_${toId}`).emit('friend_request', { fromId: req.userId, fromName: fromUser.username })
  res.json({ success: true })
})

// Получить заявки
app.get('/api/friends/requests', auth, async (req: any, res) => {
  const requests = await db.all(`SELECT f.user_id as fromId, u.username as fromName, u.avatar FROM friends f JOIN users u ON f.user_id = u.id WHERE f.friend_id = ? AND f.status = 'pending'`, [req.userId])
  res.json(requests)
})

// Принять заявку
app.post('/api/friends/accept', auth, async (req: any, res) => {
  const { fromId } = req.body
  await db.run('UPDATE friends SET status = ? WHERE user_id = ? AND friend_id = ?', ['accepted', fromId, req.userId])
  await db.run('INSERT OR IGNORE INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)', [req.userId, fromId, 'accepted'])
  const io = req.app.get('io')
  const user = await db.get('SELECT username FROM users WHERE id = ?', [req.userId])
  io.to(`user_${fromId}`).emit('friend_accepted', { friendId: req.userId, friendName: user.username })
  res.json({ success: true })
})

// Отклонить заявку
app.post('/api/friends/reject', auth, async (req: any, res) => {
  const { fromId } = req.body
  await db.run('DELETE FROM friends WHERE user_id = ? AND friend_id = ?', [fromId, req.userId])
  res.json({ success: true })
})

// Список друзей
app.get('/api/friends', auth, async (req: any, res) => {
  const friends = await db.all(`SELECT u.id, u.username, u.email, u.avatar, u.status FROM friends f JOIN users u ON f.friend_id = u.id WHERE f.user_id = ? AND f.status = 'accepted'`, [req.userId])
  res.json(friends)
})

// Удалить друга
app.delete('/api/friends/remove/:friendId', auth, async (req: any, res) => {
  await db.run('DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)', [req.userId, req.params.friendId, req.params.friendId, req.userId])
  res.json({ success: true })
})

// Получить пользователя по ID
app.get('/api/users/:id', auth, async (req: any, res) => {
  const user = await db.get('SELECT id, username, email, bio, avatar, status FROM users WHERE id = ?', [req.params.id])
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' })
  res.json(user)
})

// Обновить био
app.put('/api/users/bio', auth, async (req: any, res) => {
  const { bio } = req.body
  await db.run('UPDATE users SET bio = ? WHERE id = ?', [bio, req.userId])
  res.json({ success: true })
})

// Список чатов
app.get('/api/chats', auth, async (req: any, res) => {
  const chats = await db.all(`SELECT u.id, u.username, u.avatar, u.status, (SELECT text FROM messages WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?) ORDER BY created_at DESC LIMIT 1) as last_message FROM friends f JOIN users u ON f.friend_id = u.id WHERE f.user_id = ? AND f.status = 'accepted'`, [req.userId, req.userId, req.userId])
  res.json(chats)
})

// Сообщения
app.get('/api/chats/:userId/messages', auth, async (req: any, res) => {
  const otherId = parseInt(req.params.userId)
  const messages = await db.all(`SELECT m.*, u.username as sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC`, [req.userId, otherId, otherId, req.userId])
  res.json(messages.map((m: any) => ({ ...m, isOwn: m.sender_id === req.userId })))
})

// Отметить прочитанные
app.post('/api/messages/read', auth, async (req: any, res) => {
  const { senderId } = req.body
  await db.run('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?', [senderId, req.userId])
  const io = req.app.get('io')
  io.to(`user_${senderId}`).emit('messages_read', { userId: req.userId })
  res.json({ success: true })
})

// ПОСТЫ
app.post('/api/posts', auth, async (req: any, res) => {
  const { title, content } = req.body
  if (!title || !content) return res.status(400).json({ error: 'Заполните поля' })
  
  const result = await db.run('INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)', [title, content, req.userId])
  const post = await db.get('SELECT p.*, u.username as author_name FROM posts p JOIN users u ON p.author_id = u.id WHERE p.id = ?', [result.lastID])
  res.status(201).json(post)
})

app.get('/api/posts', auth, async (req: any, res) => {
  const posts = await db.all(`SELECT p.*, u.username as author_name FROM posts p JOIN users u ON p.author_id = u.id ORDER BY p.created_at DESC`)
  res.json(posts)
})

app.post('/api/posts/:id/comments', auth, async (req: any, res) => {
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'Введите комментарий' })
  
  const result = await db.run('INSERT INTO post_comments (post_id, user_id, text) VALUES (?, ?, ?)', [req.params.id, req.userId, text])
  const comment = await db.get('SELECT c.*, u.username FROM post_comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?', [result.lastID])
  res.json(comment)
})

app.get('/api/posts/:id/comments', auth, async (req: any, res) => {
  const comments = await db.all(`SELECT c.*, u.username FROM post_comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY created_at ASC`, [req.params.id])
  res.json(comments)
})

app.delete('/api/posts/:id', auth, async (req: any, res) => {
  await db.run('DELETE FROM posts WHERE id = ? AND author_id = ?', [req.params.id, req.userId])
  res.json({ success: true })
})

// Socket.IO
const server = http.createServer(app)
const io = new Server(server, { 
  cors: { origin: 'http://localhost:5173' },
  transports: ['websocket', 'polling']
})
app.set('io', io)

io.on('connection', (socket) => {
  let userId: number | null = null
  
  socket.on('auth', async (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      userId = decoded.userId
      socket.join(`user_${userId}`)
      await db.run('UPDATE users SET status = ? WHERE id = ?', ['online', userId])
      io.emit('user_status', { userId, status: 'online' })
    } catch {}
  })
  
  socket.on('send_message', async (data) => {
    if (!userId) return
    const result = await db.run('INSERT INTO messages (sender_id, receiver_id, text) VALUES (?, ?, ?)', [userId, data.receiverId, data.text])
    const user = await db.get('SELECT username FROM users WHERE id = ?', [userId])
    const message = { 
      id: result.lastID, 
      sender_id: userId, 
      sender_name: user.username, 
      text: data.text, 
      created_at: Date.now(), 
      is_read: 0 
    }
    io.to(`user_${data.receiverId}`).emit('new_message', { ...message, isOwn: false })
    socket.emit('message_sent', { ...message, isOwn: true, chatId: data.receiverId })
  })
  
  socket.on('disconnect', async () => {
    if (userId) {
      await db.run('UPDATE users SET status = ? WHERE id = ?', ['offline', userId])
      io.emit('user_status', { userId, status: 'offline' })
    }
  })
})

server.listen(PORT, () => console.log(`Сервер: http://localhost:${PORT}`))
