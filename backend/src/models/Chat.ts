import { pool } from '../database'

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

export class ChatModel {
  static async createChat(userId1: number, userId2: number): Promise<number> {
    const result = await pool.query(
      'INSERT INTO chats (name) VALUES ($1) RETURNING id',
      [`chat_${userId1}_${userId2}`]
    )
    const chatId = result.rows[0].id
    
    await pool.query(
      'INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2), ($1, $3)',
      [chatId, userId1, userId2]
    )
    
    return chatId
  }

  static async getChats(userId: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT c.id, c.name, 
        (SELECT text FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
       FROM chats c
       JOIN chat_participants cp ON c.id = cp.chat_id
       WHERE cp.user_id = $1`,
      [userId]
    )
    return result.rows
  }

  static async getMessages(chatId: number, userId: number): Promise<Message[]> {
    const result = await pool.query(
      `SELECT m.id, m.chat_id as "chatId", m.sender_id as "senderId", 
              u.username as "senderName", m.text, m.created_at as timestamp, m.is_read as "isRead"
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       JOIN chat_participants cp ON m.chat_id = cp.chat_id
       WHERE m.chat_id = $1 AND cp.user_id = $2
       ORDER BY m.created_at ASC`,
      [chatId, userId]
    )
    
    return result.rows.map(row => ({
      ...row,
      timestamp: new Date(row.timestamp).getTime(),
      isOwn: row.senderId === userId
    }))
  }

  static async sendMessage(chatId: number, senderId: number, text: string): Promise<Message> {
    const result = await pool.query(
      'INSERT INTO messages (chat_id, sender_id, text) VALUES ($1, $2, $3) RETURNING id, created_at',
      [chatId, senderId, text]
    )
    
    const sender = await pool.query('SELECT username FROM users WHERE id = $1', [senderId])
    
    return {
      id: result.rows[0].id,
      chatId,
      senderId,
      senderName: sender.rows[0].username,
      text,
      timestamp: new Date(result.rows[0].created_at).getTime(),
      isRead: false,
      isOwn: true
    }
  }

  static async getOrCreatePrivateChat(userId1: number, userId2: number): Promise<number> {
    const result = await pool.query(
      `SELECT c.id 
       FROM chats c
       JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = $1
       JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = $2
       WHERE (SELECT COUNT(*) FROM chat_participants WHERE chat_id = c.id) = 2`,
      [userId1, userId2]
    )
    
    if (result.rows.length > 0) {
      return result.rows[0].id
    }
    
    return await this.createChat(userId1, userId2)
  }
}
