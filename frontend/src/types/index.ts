export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  status?: 'online' | 'offline'
  bio?: string
  friendsCount?: number
  chatsCount?: number
}

export interface ChatRoom {
  id: string
  name: string
  lastMessage?: string
  lastMessageTime?: number
  unreadCount: number
  participants: User[]
  avatar?: string
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  senderName: string
  text: string
  timestamp: number
  isOwn: boolean
}

export interface Friend {
  id: string
  username: string
  email: string
  status: 'online' | 'offline'
  avatar?: string
}
