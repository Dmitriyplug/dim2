import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth'
import { postService } from '../services/postService'

export const postController = {
  async create(req: AuthRequest, res: Response) {
    try {
      const { title, content } = req.body
      const post = await postService.create(title, content, req.userId!, req.user.username)
      res.status(201).json(post)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  },

  async getAll(req: AuthRequest, res: Response) {
    try {
      const posts = await postService.getAll()
      res.json(posts)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const post = await postService.getById(parseInt(req.params.id))
      res.json(post)
    } catch (err: any) {
      res.status(404).json({ error: err.message })
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { title, content } = req.body
      const post = await postService.update(parseInt(req.params.id), title, content, req.userId!)
      res.json(post)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const result = await postService.delete(parseInt(req.params.id), req.userId!)
      res.json(result)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }
}
