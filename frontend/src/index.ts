import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { initDatabase } from './database'
import authRoutes from './routes/authRoutes'
import postRoutes from './routes/postRoutes'
import messageRoutes from './routes/messageRoutes'
import { messageService } from './services/messageService'
import { userService } from './services/userService'

const app = express()
const PORT = 3002
const JWT_SECRET = 'secretkey'

app.use(cors())
app.use(express.json())

initDatabase()

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api', messageRoutes)

const server = http.createServer(app)
const io = new Server(server, { 
  cors: { origin: 'http://localhost:5173' },
  transports: ['websocket', 'polling']
})

io.on('connection', (socket) => {
  let currentUserId: number | null = null
  
  socket.on('auth', async (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      currentUserId = decoded.userId
      socket.join(`user_${currentUserId}`)
      await userService.updateStatus(currentUserId, 'online')
      io.emit('user_status', { userId: currentUserId, status: 'online' })
      console.log(`✅ ${currentUserId} онлайн`)
    } catch (err) {
      console.error('Auth error:', err)
    }
  })
  
  socket.on('send_message', async (data) => {
    if (!currentUserId) return
    try {
      const message = await messageService.sendMessage(currentUserId, data.receiverId, data.text)
      io.to(`user_${data.receiverId}`).emit('new_message', { ...message, isOwn: false })
      socket.emit('message_sent', { ...message, isOwn: true })
    } catch (err) {
      console.error(err)
    }
  })
  
  socket.on('mark_read', async (data) => {
    if (!currentUserId) return
    await messageService.markAsRead(data.senderId, currentUserId)
    io.to(`user_${data.senderId}`).emit('messages_read', { userId: currentUserId })
  })
  
  socket.on('disconnect', async () => {
    if (currentUserId) {
      await userService.updateStatus(currentUserId, 'offline')
      io.emit('user_status', { userId: currentUserId, status: 'offline' })
      console.log(`❌ ${currentUserId} оффлайн`)
    }
  })
})

server.listen(PORT, () => console.log(`🚀 Сервер: http://localhost:${PORT}`))
