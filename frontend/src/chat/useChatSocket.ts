import { useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import type {
  ChatJoinAck,
  ChatMessage,
  ChatJoinPayload,
  ChatSendAck,
} from './chatTypes'
import type { ChatRoomName } from './chatTypes'

type ChatConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

function isSystemMessage(message: ChatMessage): message is ChatMessage & { kind: 'system' } {
  return message.kind === 'system'
}

export function useChatSocket(backendUrl: string) {
  const socketRef = useRef<Socket | null>(null)
  const activeRoomRef = useRef<ChatRoomName | null>(null)

  const [status, setStatus] = useState<ChatConnectionStatus>('disconnected')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)

  const disconnect = useCallback(() => {
    const socket = socketRef.current
    socketRef.current = null
    activeRoomRef.current = null

    if (socket) {
      socket.removeAllListeners()
      socket.disconnect()
    }

    setStatus('disconnected')
  }, [])

  const connect = useCallback(
    (payload: ChatJoinPayload) => {
      setError(null)

      // Если уже есть активное соединение — разрываем, чтобы не ловить дубликаты событий.
      disconnect()

      const socket = io(backendUrl, {
        autoConnect: false,
        transports: ['websocket'],
      })

      socketRef.current = socket
      activeRoomRef.current = payload.room
      setStatus('connecting')

      socket.on('connect', () => {
        const onJoinAck = (ack: ChatJoinAck) => {
          if (ack.ok) {
            setStatus('connected')
          } else {
            setStatus('error')
            setError(ack.error)
          }
        }

        socket.emit('chat:join', payload, onJoinAck)
      })

      socket.on('connect_error', (e) => {
        setStatus('error')
        setError(e instanceof Error ? e.message : 'Ошибка подключения')
      })

      socket.on('disconnect', () => {
        setStatus('disconnected')
      })

      socket.on('chat:history', (history: ChatMessage[]) => {
        setMessages(history)
      })

      socket.on('chat:message', (message: ChatMessage) => {
        setMessages((prev) => [...prev, message])
      })

      socket.connect()
    },
    [backendUrl, disconnect],
  )

  const sendMessage = useCallback(
    (text: string) => {
      const socket = socketRef.current
      const room = activeRoomRef.current
      if (!socket || !room) return

      socket.emit(
        'chat:message',
        { room, text },
        (ack: ChatSendAck) => {
          if (!ack.ok) {
            setStatus('error')
            setError(ack.error)
          }
        },
      )
    },
    [setStatus],
  )

  useEffect(() => {
    return () => disconnect()
  }, [disconnect])

  return {
    status,
    error,
    messages,
    connect,
    disconnect,
    sendMessage,
    isSystemMessage,
  }
}

