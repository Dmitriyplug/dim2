import type { Server, Socket } from 'socket.io'
import { DEFAULT_ROOM } from './chatTypes'
import type {
  ChatJoinAck,
  ChatJoinPayload,
  ChatSendAck,
  ChatSendPayload,
  SocketChatData,
} from './chatTypes'
import type { ChatMessage } from './chatTypes'
import { addSystemMessage, addUserMessage, getRoomHistory } from './chatService'

function isValidRoom(room: string): boolean {
  return room.trim().length >= 1 && room.trim().length <= 40
}

function isValidNickname(nickname: string): boolean {
  return nickname.trim().length >= 1 && nickname.trim().length <= 30
}

export function registerChatHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    const socketData = socket.data as SocketChatData
    if (!socketData.room) socketData.room = DEFAULT_ROOM

    socket.on(
      'chat:join',
      (payload: ChatJoinPayload, callback: (ack: ChatJoinAck) => void) => {
        try {
          const room = payload?.room?.toString?.() ?? ''
          const nickname = payload?.nickname?.toString?.() ?? ''

          if (!isValidRoom(room)) {
            callback({ ok: false, error: 'Некорректное имя комнаты' })
            return
          }
          if (!isValidNickname(nickname)) {
            callback({ ok: false, error: 'Некорректное имя' })
            return
          }

          // Если пользователь переподключается/меняет комнату
          if (socketData.room && socketData.room !== room) {
            socket.leave(socketData.room)
          }

          socketData.room = room
          socketData.nickname = nickname

          socket.join(room)

          const history = getRoomHistory(room)
          socket.emit('chat:history', history)

          const systemMessage = addSystemMessage({
            room,
            text: `${nickname} присоединился(лась)`,
          })
          io.to(room).emit('chat:message', systemMessage satisfies ChatMessage)

          callback({ ok: true })
        } catch (e) {
          callback({
            ok: false,
            error: e instanceof Error ? e.message : 'Ошибка обработки join',
          })
        }
      },
    )

    socket.on(
      'chat:message',
      (payload: ChatSendPayload, callback: (ack: ChatSendAck) => void) => {
        try {
          const room = payload?.room?.toString?.() ?? ''
          const text = payload?.text?.toString?.() ?? ''

          if (!socketData.room || socketData.room !== room) {
            callback({ ok: false, error: 'Нет доступа к этой комнате' })
            return
          }
          if (!socketData.nickname) {
            callback({ ok: false, error: 'Сначала выполните join' })
            return
          }
          const message = addUserMessage({
            room,
            nickname: socketData.nickname,
            text,
          })

          io.to(room).emit('chat:message', message satisfies ChatMessage)
          callback({ ok: true })
        } catch (e) {
          callback({
            ok: false,
            error: e instanceof Error ? e.message : 'Ошибка отправки сообщения',
          })
        }
      },
    )

    socket.on('disconnect', () => {
      const room = socketData.room
      const nickname = socketData.nickname
      if (!room || !nickname) return

      const systemMessage = addSystemMessage({
        room,
        text: `${nickname} вышел(ла)`,
      })
      io.to(room).emit('chat:message', systemMessage satisfies ChatMessage)
    })
  })
}

