import { pool } from '../database'

export const messageService = {
  async sendMessage(senderId: number, receiverId: number, text: string) {
    if (!text.trim()) throw new Error('Сообщение не может быть пустым')
    
    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, text) VALUES ($1, $2, $3) RETURNING *',
      [senderId, receiverId, text]
    )
    
    const sender = await pool.query('SELECT username FROM users WHERE id = $1', [senderId])
    return {
      id: result.rows[0].id,
      sender_id: senderId,
      sender_name: sender.rows[0].username,
      text: text,
      created_at: Date.now(),
      is_read: 0
    }
  },

  async getMessages(userId1: number, userId2: number) {
    const messages = await pool.query(`
      SELECT m.*, u.username as sender_name 
      FROM messages m 
      JOIN users u ON m.sender_id = u.id 
      WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
    `, [userId1, userId2])
    
    return messages.rows.map((m: any) => ({
      ...m,
      isOwn: m.sender_id === userId1
    }))
  },

  async markAsRead(senderId: number, receiverId: number) {
    await pool.query(
      'UPDATE messages SET is_read = 1 WHERE sender_id = $1 AND receiver_id = $2 AND is_read = 0',
      [senderId, receiverId]
    )
  },

  async getChats(userId: number) {
    const chats = await pool.query(`
      SELECT DISTINCT 
        u.id, u.username, u.avatar, u.status,
        (SELECT text FROM messages WHERE 
          (sender_id = $1 AND receiver_id = u.id) OR 
          (sender_id = u.id AND receiver_id = $1) 
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE 
          (sender_id = $1 AND receiver_id = u.id) OR 
          (sender_id = u.id AND receiver_id = $1) 
         ORDER BY created_at DESC LIMIT 1) as last_message_time
      FROM users u
      WHERE u.id IN (
        SELECT DISTINCT 
          CASE 
            WHEN sender_id = $1 THEN receiver_id 
            ELSE sender_id 
          END
        FROM messages 
        WHERE sender_id = $1 OR receiver_id = $1
      )
    `, [userId])
    
    return chats.rows
  }
}
