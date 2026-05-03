import { pool } from '../database'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const JWT_SECRET = 'secretkey'

export const userService = {
  async register(username: string, email: string, password: string) {
    const existing = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email])
    if (existing.rows.length > 0) {
      throw new Error('Пользователь уже существует')
    }
    
    const hash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, bio, avatar, status',
      [username, email, hash]
    )
    const user = result.rows[0]
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    
    return { user, token }
  },

  async login(username: string, password: string) {
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username])
    if (user.rows.length === 0) {
      throw new Error('Неверный логин или пароль')
    }
    
    const valid = await bcrypt.compare(password, user.rows[0].password_hash)
    if (!valid) {
      throw new Error('Неверный логин или пароль')
    }
    
    const token = jwt.sign({ userId: user.rows[0].id }, JWT_SECRET, { expiresIn: '7d' })
    const userData = {
      id: user.rows[0].id,
      username: user.rows[0].username,
      email: user.rows[0].email,
      bio: user.rows[0].bio,
      avatar: user.rows[0].avatar,
      status: user.rows[0].status
    }
    
    return { user: userData, token }
  },

  async searchUsers(query: string, currentUserId: number) {
    const users = await pool.query(
      'SELECT id, username, email, avatar, status FROM users WHERE username ILIKE $1 AND id != $2 LIMIT 20',
      [`%${query}%`, currentUserId]
    )
    return users.rows
  },

  async getUserById(userId: number) {
    const user = await pool.query('SELECT id, username, email, bio, avatar, status FROM users WHERE id = $1', [userId])
    if (user.rows.length === 0) throw new Error('Пользователь не найден')
    return user.rows[0]
  },

  async updateBio(userId: number, bio: string) {
    await pool.query('UPDATE users SET bio = $1 WHERE id = $2', [bio, userId])
    return { success: true }
  },

  async updateStatus(userId: number, status: string) {
    await pool.query('UPDATE users SET status = $1 WHERE id = $2', [status, userId])
  }
}
