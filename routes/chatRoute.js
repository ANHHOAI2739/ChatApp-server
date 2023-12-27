import express from 'express';
import {
  accessChat,
  addToGroup,
  createGroup,
  exitGroup,
  fetchChat,
  removeFromGroup,
  renameGroup,
} from '../controllers/chatController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', accessChat);
router.get('/', fetchChat);
router.post('/group', createGroup);
router.put('/group/rename', renameGroup);
router.put('/groupAdd', addToGroup);
router.put('/groupRemove', removeFromGroup);
router.put('/exitGroup', exitGroup);

export default router;
