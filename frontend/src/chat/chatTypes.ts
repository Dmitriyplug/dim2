export type ChatMessageKind = 'user' | 'system'

export type ChatRoomName = string
export type ChatNickname = string

export interface ChatMessage {
  kind: ChatMessageKind
  id: string
  room: ChatRoomName
  author: ChatNickname
  text: string
  createdAt: number
}

export interface ChatJoinPayload {
  room: ChatRoomName
  nickname: ChatNickname
}

export interface ChatJoinAckOk {
  ok: true
}

export interface ChatJoinAckError {
  ok: false
  error: string
}

export type ChatJoinAck = ChatJoinAckOk | ChatJoinAckError

export interface ChatSendPayload {
  room: ChatRoomName
  text: string
}

export interface ChatSendAckOk {
  ok: true
}

export interface ChatSendAckError {
  ok: false
  error: string
}

export type ChatSendAck = ChatSendAckOk | ChatSendAckError

