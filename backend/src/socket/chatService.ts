import { randomUUID } from 'crypto'
import type { ChatMessage, ChatRoomName, ChatNickname } from './chatTypes'

type MessagesByRoom = Map<ChatRoomName, ChatMessage[]>

// In-memory хранилище. Для масштабирования в проде замените на Redis/PostgreSQL.
const messagesByRoom: MessagesByRoom = new Map()

const MAX_MESSAGES_PER_ROOM = 200
const MAX_TEXT_LENGTH = 500

export function getRoomHistory(room: ChatRoomName): ChatMessage[] {
  return messagesByRoom.get(room) ?? []
}

export function addUserMessage(params: {
  room: ChatRoomName
  nickname: ChatNickname
  text: string
}): ChatMessage {
  const text = normalizeText(params.text)
  if (!text) {
    throw new Error('Сообщение не может быть пустым')
  }
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error('Сообщение слишком длинное')
  }

  const message: ChatMessage = {
    kind: 'user',
    id: randomUUID(),
    room: params.room,
    author: params.nickname,
    text,
    createdAt: Date.now(),
  }

  storeMessage(message)
  return message
}

export function addSystemMessage(params: {
  room: ChatRoomName
  text: string
}): ChatMessage {
  const text = normalizeText(params.text)
  const message: ChatMessage = {
    kind: 'system',
    id: randomUUID(),
    room: params.room,
    author: 'system',
    text,
    createdAt: Date.now(),
  }

  storeMessage(message)
  return message
}

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

function storeMessage(message: ChatMessage) {
  const current = messagesByRoom.get(message.room) ?? []
  current.push(message)
  if (current.length > MAX_MESSAGES_PER_ROOM) {
    current.splice(0, current.length - MAX_MESSAGES_PER_ROOM)
  }
  messagesByRoom.set(message.room, current)
}

