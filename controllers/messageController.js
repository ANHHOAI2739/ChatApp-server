import asyncHandler from 'express-async-handler';
import Message from '../models/messageModel.js';
import Chat from '../models/chatModel.js';

export const sendMessage = asyncHandler(async (req, res) => {
  const { chatId, message } = req.body;
  let msg = await Message.create({
    sender: req.user.id,
    message,
    chat: chatId,
  });
  msg = await (
    await msg.populate('sender', 'name profilePic email')
  ).populate({
    path: 'chat',
    select: 'chatName isGroup users',
    model: 'Chat',
    populate: {
      path: 'users',
      select: 'name email profilePic',
      model: 'User',
    },
  });
  if (!msg) {
    return res
      .status(500)
      .json({ message: 'Failed to create and send message' });
  }
  await Chat.findByIdAndUpdate(chatId, { latestMessage: msg });
  res.status(200).json(msg);
});

export const getMessages = async (req, res) => {
  const { chatId } = req.params;
  try {
    let messages = await Message.find({ chat: chatId })
      .populate({
        path: 'chat',
        model: 'Chat',
      })
      .populate({
        path: 'sender',
        model: 'User',
        select: 'name profilePic email',
      });

    res.status(200).json(messages);
  } catch (error) {
    res.sendStatus(500).json({ error: error });
    console.log(error);
  }
};
