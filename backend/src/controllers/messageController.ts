import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth'
import { messageService } from '../services/messageService'

export const messageController = {
  async getChats(req: AuthRequest, res: Response) {
    try {
      const chats = await messageService.getChats(req.userId!)
      res.json(chats)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  },

  async getMessages(req: AuthRequest, res: Response) {
    try {
      const messages = await messageService.getMessages(req.userId!, parseInt(req.params.userId))
      res.json(messages)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  },

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const { senderId } = req.body
      await messageService.markAsRead(senderId, req.userId!)
      res.json({ success: true })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }
}
