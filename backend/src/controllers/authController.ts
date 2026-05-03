import { Request, Response } from 'express'
import { userService } from '../services/userService'

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body
      const result = await userService.register(username, email, password)
      res.json(result)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body
      const result = await userService.login(username, password)
      res.json(result)
    } catch (err: any) {
      res.status(401).json({ error: err.message })
    }
  },

  async searchUsers(req: any, res: Response) {
    try {
      const { q } = req.query
      const users = await userService.searchUsers(q as string, req.userId)
      res.json(users)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  },

  async getUser(req: any, res: Response) {
    try {
      const user = await userService.getUserById(parseInt(req.params.id))
      res.json(user)
    } catch (err: any) {
      res.status(404).json({ error: err.message })
    }
  },

  async updateBio(req: any, res: Response) {
    try {
      const { bio } = req.body
      await userService.updateBio(req.userId, bio)
      res.json({ success: true })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }
}
