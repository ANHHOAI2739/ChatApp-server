import asyncHandler from 'express-async-handler';
import Chat from '../models/chatModel.js';
import User from '../models/userModel.js';
import mongoose from 'mongoose';

export const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(403).json({ message: 'UserId is required' });
  }
  let existChat = await Chat.find({
    isGroup: false,
    $and: [
      { users: { $elemMatch: { $eq: userId } } },
      { users: { $elemMatch: { $eq: req.user.id } } },
    ],
  })
    .populate('users', '-password')
    .populate('latestMessage');
  existChat = await User.populate(existChat, {
    path: 'latestMessage.sender',
    select: 'username email profilePic',
  });

  if (existChat.length > 0) {
    res.status(200).send(existChat[0]);
  } else {
    let chatData = {
      chatName: 'sender',
      isGroup: false,
      users: [req.user.id, userId],
    };
    try {
      const newChat = await Chat.create(chatData);
      const chat = await Chat.findOne({ _id: newChat._id }).populate(
        'users',
        '-password',
      );
      res.status(200).json(chat);
    } catch (error) {
      res.status(400).json(error.message);
    }
  }
});

export const fetchChat = asyncHandler(async (req, res) => {
  const chats = await Chat.find({
    users: { $elemMatch: { $eq: req.user.id } },
  })
    .populate('users')
    .populate('latestMessage')
    .populate('groupAdmin')
    .sort({ updateAt: -1 });
  const finalChats = await User.populate(chats, {
    path: 'lastestMessage.sender',
    select: 'name email profilePic',
  });
  res.status(200).json({ finalChats, message: 'fetch chat successfully' });
});

export const createGroup = asyncHandler(async (req, res) => {
  const { chatName, users } = req.body;
  if (!chatName || !users) {
    res.status(400).json({ message: 'Please fill all the fields' });
  }
  const groupUsers = users;
  if (groupUsers.length < 2) {
    res.status(400).json({ message: 'Group should have more than 2 users' });
  }
  groupUsers.push(req.user);
  try {
    const chat = await Chat.create({
      chatName: chatName,
      users: groupUsers,
      isGroup: true,
      groupAdmin: req.user,
    });
    const createdChat = await Chat.findOne({ _id: chat._id }).populate(
      'users',
      '-password',
    );
    res
      .status(200)
      .json({ chat: createdChat, message: 'Create group successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;
  if (!chatId || !chatName)
    res.status(400).send('Provide Chat id and Chat name');

  const chat = await Chat.findByIdAndUpdate(
    chatId,
    { $set: { chatName } },
    { new: true },
  )
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  if (!chat) {
    return res.status(404).send('Chat not found');
  }
  res.status(200).send({ chat, message: 'Rename group successfully' });
});

export const addToGroup = asyncHandler(async (req, res) => {
  try {
    const { userId, chatId } = req.body;
    const existChat = await Chat.findOne({ _id: chatId });
    if (!existChat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    if (!existChat.users.includes(userId)) {
      const chat = await Chat.findByIdAndUpdate(
        chatId,
        {
          $push: { users: userId },
        },
        { new: true },
      )
        .populate('groupAdmin', '-password')
        .populate('users', '-password');

      if (!chat) {
        return res.status(500).json({ message: 'Failed to update chat' });
      }
      return res
        .status(200)
        .json({ chat, message: 'Add new user successfully' });
    } else {
      return res.status(400).json({ message: 'User is already in the group' });
    }
  } catch (error) {
    console.error('Error in addToGroup:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export const removeFromGroup = asyncHandler(async (req, res) => {
  try {
    const { userId, chatId } = req.body;
    const existChat = await Chat.findOne({ _id: chatId });
    if (!existChat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    if (existChat.users.includes(userId)) {
      const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        { $pull: { users: userId } },
        { new: true },
      )
        .populate('groupAdmin', '-password')
        .populate('users', '-password');

      if (!updatedChat) {
        return res.status(500).json({ message: 'Failed to update chat' });
      }
      return res.status(200).json(updatedChat);
    } else {
      return res
        .status(409)
        .json({ message: 'User does not exist in the group' });
    }
  } catch (error) {
    console.error('Error in removeFromGroup:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export const exitGroup = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId, transferToUserId } = req.body;
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true },
    )
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    if (!updatedChat) {
      return res.status(404).json({ message: 'Chat does not exist' });
    }
    // Check if the user is the group admin
    const isGroupAdmin =
      updatedChat.groupAdmin && updatedChat.groupAdmin._id.equals(userId);

    if (isGroupAdmin) {
      // If the exiting user is the admin, transfer admin role to the selected user
      if (
        transferToUserId &&
        updatedChat.users.some((user) => user._id.equals(transferToUserId))
      ) {
        const updatedChatWithNewAdmin = await Chat.findByIdAndUpdate(
          chatId,
          { $set: { groupAdmin: transferToUserId } },
          { new: true },
        )
          .populate('users', '-password')
          .populate('groupAdmin', '-password');

        if (!updatedChatWithNewAdmin) {
          return res
            .status(500)
            .json({ message: 'Failed to update chat with new admin' });
        }
        return res
          .status(200)
          .json({ message: 'Exit successfully. Admin role transferred.' });
      } else {
        return res
          .status(400)
          .json({ message: 'Invalid user selected for admin transfer' });
      }
    }
    return res.status(200).json({ message: 'Exit successfully' });
  } catch (error) {
    console.error('Error in exitGroup:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
