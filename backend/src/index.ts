import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3002

app.use(cors())
app.use(express.json())

// Временное хранилище в памяти
const users: any[] = []
let nextId = 1

app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body
  
  const existing = users.find(u => u.username === username)
  if (existing) {
    return res.status(400).json({ error: 'Username already exists' })
  }
  
  const user = { id: nextId++, username, email, password }
  users.push(user)
  
  console.log('Registered:', user)
  res.json({ user, token: 'token-' + user.id })
})

app.post('/api/login', (req, res) => {
  const { username, password } = req.body
  
  const user = users.find(u => u.username === username && u.password === password)
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  
  res.json({ user, token: 'token-' + user.id })
})

app.get('/api/users/search', (req, res) => {
  const { q } = req.query
  const results = users.filter(u => 
    u.username.toLowerCase().includes(String(q).toLowerCase())
  )
  res.json(results)
})

app.get('/api/friends', (req, res) => {
  res.json([])
})

app.post('/api/friends/add', (req, res) => {
  res.json({ success: true })
})

app.delete('/api/friends/remove/:friendId', (req, res) => {
  res.json({ success: true })
})

app.get('/api/chats', (req, res) => {
  res.json([])
})

app.get('/api/chats/:chatId/messages', (req, res) => {
  res.json([])
})

app.post('/api/chats/start', (req, res) => {
  res.json({ chatId: Date.now() })
})

app.put('/api/users/bio', (req, res) => {
  res.json({ success: true })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log('✅ Упрощённая версия без PostgreSQL')
})
