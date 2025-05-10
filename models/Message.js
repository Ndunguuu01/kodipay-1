const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  // For group chats, this will reference the property ID (group chat is per property)
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: false, // Only required for group chats
  },
  // For direct messages, this will reference the recipient user ID
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Only required for direct messages
  },
  isGroupMessage: {
    type: Boolean,
    default: false, // True for group messages, false for direct messages
  },
});

module.exports = mongoose.model('Message', messageSchema);