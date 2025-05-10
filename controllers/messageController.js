const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
  const { receiverId, content } = req.body;

  try {
    const message = new Message({
      sender: req.user.id,
      receiver: receiverId,
      content,
    });

    await message.save();
    res.status(201).json(message);

    // Emit message via Socket.IO
    const io = req.app.get('socketio');
    io.to(receiverId).emit('newMessage', message);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMessages = async (req, res) => {
  const { userId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id },
      ],
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};