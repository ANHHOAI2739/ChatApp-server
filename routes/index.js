import express from 'express';
import userRouter from './userRoute.js';
import chatRouter from './chatRoute.js';
import messageRouter from './messageRoute.js';

const router = express.Router();

router.use('/auth', userRouter);
router.use('/chat', chatRouter);
router.use('/message', messageRouter);

export default router;
