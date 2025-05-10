const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const Property = require('../models/Property');
const auth = require('../middleware/auth');

// Fetch group chat messages for a property
router.get('/group/:propertyId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      propertyId: req.params.propertyId,
      isGroupMessage: true,
    })
      .populate('sender', 'phoneNumber')
      .sort({ timestamp: 1 });
    res.status(200).json(messages);
  } catch (err) {
    console.error('Error fetching group messages:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch direct messages between two users
router.get('/direct/:recipientId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: req.params.recipientId, isGroupMessage: false },
        { sender: req.params.recipientId, recipient: req.user.id, isGroupMessage: false },
      ],
    })
      .populate('sender', 'phoneNumber')
      .populate('recipient', 'phoneNumber')
      .sort({ timestamp: 1 });
    res.status(200).json(messages);
  } catch (err) {
    console.error('Error fetching direct messages:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;