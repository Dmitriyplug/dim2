import { pool } from '../database'

export interface Friend {
  id: number
  username: string
  email: string
  status: string
}

export class FriendModel {
  static async addFriend(userId: number, friendUsername: string): Promise<boolean> {
    const friend = await pool.query('SELECT id FROM users WHERE username = $1', [friendUsername])
    if (friend.rows.length === 0) return false
    
    const friendId = friend.rows[0].id
    if (userId === friendId) return false
    
    try {
      await pool.query(
        'INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, $3)',
        [userId, friendId, 'accepted']
      )
      await pool.query(
        'INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, $3)',
        [friendId, userId, 'accepted']
      )
      return true
    } catch {
      return false
    }
  }

  static async removeFriend(userId: number, friendId: number): Promise<boolean> {
    try {
      await pool.query(
        'DELETE FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
        [userId, friendId]
      )
      return true
    } catch {
      return false
    }
  }

  static async getFriends(userId: number): Promise<Friend[]> {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.status 
       FROM friends f 
       JOIN users u ON f.friend_id = u.id 
       WHERE f.user_id = $1 AND f.status = 'accepted'`,
      [userId]
    )
    return result.rows
  }
}
