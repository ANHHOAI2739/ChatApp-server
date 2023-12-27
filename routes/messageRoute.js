import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  getMessages,
  // receiveMessage,
  sendMessage,
} from '../controllers/messageController.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', sendMessage);
router.get('/:chatId', getMessages);

export default router;
