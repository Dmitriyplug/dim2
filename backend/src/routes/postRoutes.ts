import { Router } from 'express'
import { postController } from '../controllers/postController'
import { authMiddleware } from '../middlewares/auth'

const router = Router()

router.post('/', authMiddleware, postController.create)
router.get('/', authMiddleware, postController.getAll)
router.get('/:id', authMiddleware, postController.getById)
router.put('/:id', authMiddleware, postController.update)
router.delete('/:id', authMiddleware, postController.delete)

export default router
