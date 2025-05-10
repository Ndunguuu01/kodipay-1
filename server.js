require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const jwtSecret = process.env.JWT_SECRET;
const socketIo = require('socket.io');

// Import routes
const authRoutes = require('./routes/auth');
const complaintsRoutes = require('./routes/complaints');
const propertiesRoutes = require('./routes/properties');
const messageRoutes = require('./routes/messages');
const billsRoutes = require('./routes/bills');
const leasesRoutes = require('./routes/leases'); 
const paymentsRoutes = require('./routes/payments');
const tenantRoutes = require('./routes/tenants');
const roomsRouter = require('./routes/rooms');  

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost/kodipay', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Socket.io setup
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join a group chat room based on propertyId
  socket.on('joinGroupChat', (propertyId) => {
    socket.join(propertyId);
    console.log(`User ${socket.id} joined group chat for property ${propertyId}`);
  });

  // Join a direct message room based on user IDs
  socket.on('joinDirectMessage', ({ senderId, recipientId }) => {
    const room = [senderId, recipientId].sort().join('_');
    socket.join(room);
    console.log(`User ${socket.id} joined direct message room ${room}`);
  });

  // Handle sending group messages
  socket.on('sendGroupMessage', async (data) => {
    const { propertyId, senderId, content } = data;
    try {
      const message = new (require('./models/Message'))({
        sender: senderId,
        content,
        propertyId,
        isGroupMessage: true,
      });
      await message.save();
      io.to(propertyId).emit('groupMessage', {
        sender: senderId,
        content,
        timestamp: message.timestamp,
      });
    } catch (err) {
      console.error('Error sending group message:', err.message);
    }
  });

  // Handle sending direct messages
  socket.on('sendDirectMessage', async (data) => {
    const { senderId, recipientId, content } = data;
    try {
      const message = new (require('./models/Message'))({
        sender: senderId,
        recipient: recipientId,
        content,
        isGroupMessage: false,
      });
      await message.save();
      const room = [senderId, recipientId].sort().join('_');
      io.to(room).emit('directMessage', {
        sender: senderId,
        recipient: recipientId,
        content,
        timestamp: message.timestamp,
      });
    } catch (err) {
      console.error('Error sending direct message:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/leases', leasesRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/rooms', roomsRouter);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));