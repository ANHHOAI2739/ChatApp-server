import mongoose from 'mongoose';
const messageSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    message: {
      type: String,
      trim: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
  },
  {
    timestamps: true,
  },
);
const Message = mongoose.model('Message', messageSchema);
export default Message;
