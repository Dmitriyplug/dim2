export interface User {
  id: number
  username: string
  email: string
  bio: string
  status: 'online' | 'offline'
  avatar?: string
  last_message?: string
}

export interface Message {
  id: number
  tempId?: number
  sender_id: number
  receiver_id: number
  sender_name: string
  text: string
  created_at: number
  is_read: number
  isOwn: boolean
}
