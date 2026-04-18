export interface User {
  id: number
  username: string
  email: string
  bio: string
  status: 'online' | 'offline'
}

export interface Friend {
  id: number
  username: string
  email: string
  status: string
}

export interface ChatRoom {
  id: number
  name: string
  lastMessage?: string
  lastMessageTime?: number
  unreadCount: number
}

export interface Message {
  id: number
  chatId: number
  senderId: number
  senderName: string
  text: string
  timestamp: number
  isRead: boolean
  isOwn: boolean
}
