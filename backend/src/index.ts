import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import { initDatabase, pool } from './database'
import { UserModel } from './models/User'
import { FriendModel } from './models/Friend'
import { ChatModel } from './models/Chat'

const app = express()
const PORT = 3002

app.use(cors())
app.use(express.json())

initDatabase()

const authMiddleware = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  
  const decoded = UserModel.verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' })
  }
  
  const user = await UserModel.findById(decoded.userId)
  if (!user) {
    return res.status(401).json({ error: 'User not found' })
  }
  
  req.user = user
  next()
}

app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body
  
  const existingUser = await UserModel.findByUsername(username)
  if (existingUser) {
    return res.status(400).json({ error: 'Username already exists' })
  }
  
  const existingEmail = await UserModel.findByEmail(email)
  if (existingEmail) {
    return res.status(400).json({ error: 'Email already exists' })
  }
  
  const user = await UserModel.create(username, email, password)
  const token = UserModel.generateToken(user!.id, user!.username)
  
  res.json({ user, token })
})

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body
  
  const user = await UserModel.verifyPassword(username, password)
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  
  const token = UserModel.generateToken(user.id, user.username)
  res.json({ user, token })
})

app.get('/api/users/search', authMiddleware, async (req: any, res) => {
  const { q } = req.query
  const users = await UserModel.search(q as string, req.user.id)
  res.json(users)
})

app.post('/api/friends/add', authMiddleware, async (req: any, res) => {
  const { username } = req.body
  const success = await FriendModel.addFriend(req.user.id, username)
  if (success) {
    res.json({ success: true })
  } else {
    res.status(400).json({ error: 'Could not add friend' })
  }
})

app.delete('/api/friends/remove/:friendId', authMiddleware, async (req: any, res) => {
  await FriendModel.removeFriend(req.user.id, parseInt(req.params.friendId))
  res.json({ success: true })
})

app.get('/api/friends', authMiddleware, async (req: any, res) => {
  const friends = await FriendModel.getFriends(req.user.id)
  res.json(friends)
})

app.get('/api/chats', authMiddleware, async (req: any, res) => {
  const chats = await ChatModel.getChats(req.user.id)
  res.json(chats)
})

app.get('/api/chats/:chatId/messages', authMiddleware, async (req: any, res) => {
  const messages = await ChatModel.getMessages(parseInt(req.params.chatId), req.user.id)
  res.json(messages)
})

app.post('/api/chats/start', authMiddleware, async (req: any, res) => {
  const { friendId } = req.body
  const chatId = await ChatModel.getOrCreatePrivateChat(req.user.id, parseInt(friendId))
  res.json({ chatId })
})

app.put('/api/users/bio', authMiddleware, async (req: any, res) => {
  const { bio } = req.body
  await UserModel.updateBio(req.user.id, bio)
  res.json({ success: true })
})

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

io.on('connection', (socket) => {
  let currentUserId: number | null = null
  
  socket.on('auth', async (token: string) => {
    const decoded = UserModel.verifyToken(token)
    if (decoded) {
      currentUserId = decoded.userId
      await UserModel.updateStatus(currentUserId, 'online')
      socket.join(`user_${currentUserId}`)
      io.emit('user_status', { userId: currentUserId, status: 'online' })
    }
  })
  
  socket.on('send_message', async (data: { chatId: number, text: string }) => {
    if (!currentUserId) return
    
    const message = await ChatModel.sendMessage(data.chatId, currentUserId, data.text)
    
    const participants = await pool.query(
      'SELECT user_id FROM chat_participants WHERE chat_id = $1',
      [data.chatId]
    )
    
    participants.rows.forEach(p => {
      io.to(`user_${p.user_id}`).emit('new_message', message)
    })
  })
  
  socket.on('disconnect', async () => {
    if (currentUserId) {
      await UserModel.updateStatus(currentUserId, 'offline')
      io.emit('user_status', { userId: currentUserId, status: 'offline' })
    }
  })
})

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
