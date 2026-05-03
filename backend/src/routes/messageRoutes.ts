import { Router } from 'express'
import { messageController } from '../controllers/messageController'
import { authMiddleware } from '../middlewares/auth'

const router = Router()

router.get('/chats', authMiddleware, messageController.getChats)
router.get('/chats/:userId/messages', authMiddleware, messageController.getMessages)
router.post('/messages/read', authMiddleware, messageController.markAsRead)

export default router
