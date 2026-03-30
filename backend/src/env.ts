import dotenv from 'dotenv'

dotenv.config()

export const env = {
  PORT: Number.parseInt(process.env.PORT ?? '3001', 10),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  SOCKET_MAX_HTTP_BUFFER: Number.parseInt(process.env.SOCKET_MAX_HTTP_BUFFER ?? '1', 10),
}

