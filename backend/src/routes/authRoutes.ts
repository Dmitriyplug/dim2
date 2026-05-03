import { Router } from 'express'
import { authController } from '../controllers/authController'
import { authMiddleware } from '../middlewares/auth'

const router = Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/users/search', authMiddleware, authController.searchUsers)
router.get('/users/:id', authMiddleware, authController.getUser)
router.put('/users/bio', authMiddleware, authController.updateBio)

export default router
