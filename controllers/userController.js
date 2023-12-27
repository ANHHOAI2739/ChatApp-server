import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import User from '../models/userModel.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  const isMatchPassword = await bcrypt.compare(password, existingUser.password);
  if (!isMatchPassword) {
    res.status(401);
    throw new Error('Email or password is not correct!');
  }
  const jwtPayload = {
    email: existingUser.email,
    id: existingUser.id,
    fullname: existingUser.fullname,
  };
  const token = jwt.sign(jwtPayload, process.env.SECRET_KEY, {
    expiresIn: '7h',
  });
  res.json({
    accessToken: token,
    message: 'Login successfully',
  });
});

export const register = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error('User has already exist');
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const newUser = new User({
    email,
    username,
    password: hashedPassword,
  });
  await newUser.save();
  res.status(201).json({
    message: 'Register new user successfully',
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const currentUser = await User.findById(id).select('-password');
  if (!currentUser) {
    res.status(401).json({ message: 'Unauthorized user' });
  }
  res.json({
    userInfo: currentUser,
  });
});

export const fetchUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } },
        ],
        _id: { $ne: req.user._id },
      }
    : { _id: { $ne: req.user._id } };

  const users = await User.find(keyword);
  res.send(users);
});

export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const selectedUser = await User.findOne({ _id: id }).select('-password');
  res.status(200).json(selectedUser);
});

export const editInfo = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const { bio, username } = req.body;
  const editedInfo = await User.findOneAndUpdate(
    { _id: id },
    { bio, username },
  );
  res
    .status(200)
    .json({ editedProfile: editedInfo, message: 'Your info has been edited.' });
});
