import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from '../database'

const JWT_SECRET = 'secretkey'

export interface AuthRequest extends Request {
  userId?: number
  user?: any
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' })
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await pool.query('SELECT id, username, email, bio, avatar, status FROM users WHERE id = $1', [decoded.userId])
    
    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Пользователь не найден' })
    }
    
    req.userId = user.rows[0].id
    req.user = user.rows[0]
    next()
  } catch {
    res.status(401).json({ error: 'Неверный токен' })
  }
}
