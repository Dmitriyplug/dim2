import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import { env } from './env'
import { registerChatHandlers } from './socket/chatSocket'

const app = express()

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
  }),
)
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

const httpServer = http.createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: env.CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: env.SOCKET_MAX_HTTP_BUFFER * 1024 * 1024,
})

registerChatHandlers(io)

httpServer.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Сервер запущен: http://localhost:${env.PORT}`)
})

