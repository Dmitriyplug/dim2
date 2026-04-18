import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool } from '../database'

const JWT_SECRET = 'your-secret-key-change-me'

export interface User {
  id: number
  username: string
  email: string
  bio: string
  status: string
}

export class UserModel {
  static async create(username: string, email: string, password: string): Promise<User | null> {
    const passwordHash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, bio, status',
      [username, email, passwordHash]
    )
    return result.rows[0] || null
  }

  static async findByUsername(username: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT id, username, email, bio, status FROM users WHERE username = $1',
      [username]
    )
    return result.rows[0] || null
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT id, username, email, bio, status FROM users WHERE email = $1',
      [email]
    )
    return result.rows[0] || null
  }

  static async findById(id: number): Promise<User | null> {
    const result = await pool.query(
      'SELECT id, username, email, bio, status FROM users WHERE id = $1',
      [id]
    )
    return result.rows[0] || null
  }

  static async search(query: string, currentUserId: number): Promise<User[]> {
    const result = await pool.query(
      `SELECT id, username, email, bio, status 
       FROM users 
       WHERE username ILIKE $1 AND id != $2 
       LIMIT 20`,
      [`%${query}%`, currentUserId]
    )
    return result.rows
  }

  static async verifyPassword(username: string, password: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT id, username, email, password_hash, bio, status FROM users WHERE username = $1',
      [username]
    )
    const user = result.rows[0]
    if (!user) return null
    
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) return null
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      status: user.status
    }
  }

  static generateToken(userId: number, username: string): string {
    return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' })
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch {
      return null
    }
  }

  static async updateStatus(userId: number, status: string): Promise<void> {
    await pool.query('UPDATE users SET status = $1 WHERE id = $2', [status, userId])
  }

  static async updateBio(userId: number, bio: string): Promise<void> {
    await pool.query('UPDATE users SET bio = $1 WHERE id = $2', [bio, userId])
  }
}
