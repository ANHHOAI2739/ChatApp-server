import express from 'express';
import {
  editInfo,
  fetchUsers,
  getMe,
  getUserById,
  login,
  register,
} from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authMiddleware, getMe);
router.get('/fetchUsers', authMiddleware, fetchUsers);
router.get('/users/:id', authMiddleware, getUserById);
router.put('/users/update/:id', authMiddleware, editInfo);

export default router;
