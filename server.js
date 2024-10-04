

// // // // // // // // server.js



const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { protect } = require('./middlewares/authMiddleware');
const session = require('express-session');
const sharedSession = require('socket.io-express-session');
const PrivateMessage = require('./models/privateMessageModel');
const PublicMessage = require('./models/publicMessageModel');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Set view engine to EJS
app.set('view engine', 'ejs');

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'yourSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false },
});

app.use(sessionMiddleware);

// Share session between Express and Socket.IO
io.use(sharedSession(sessionMiddleware, { autoSave: true }));

// Routes
app.use('/', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/', protect, chatRoutes);

// Utility to generate consistent room name
const generateRoomName = (user1, user2) => {
  return [user1, user2].sort().join('-');
};

const usersOnline = {}; // Store online users and their statuses
// Socket.io public and private chat functionality
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // Access the username from the session
  const username = socket.handshake.session.username;

  // Emit unread messages count upon login
  socket.on('getUnreadMessages', async (username) => {
    const unreadMessages = await PrivateMessage.countDocuments({ receiver: username, unread: true });
    socket.emit('unreadNotification', unreadMessages); // Send unread count to user
  });

  // Handle joining public room
  socket.on('joinRoom', async ({ username, room }) => {
    socket.join(room);
    
    // Fetch public message history from the database
    const messages = await PublicMessage.find({ room }).sort({ timestamp: 1 });
    
    // Send message history to the user
    socket.emit('loadMessages', messages);
    
    socket.emit('message', { user: 'Admin', text: `Welcome, ${username}` });
    socket.broadcast.to(room).emit('message', { user: 'Admin', text: `${username} has joined` });
  });

  // Handle public chat messages
  socket.on('chatMessage', async ({ room, username, message }) => {
    const publicMessage = new PublicMessage({ room, sender: username, message });
    await publicMessage.save();

    io.to(room).emit('message', { user: username, text: message });
  });

  // Handle private chat initiation
  socket.on('privateChatInit', ({ from, to }) => {
    const room = generateRoomName(from, to);
    socket.join(room);
  });

  // Load private chat history
  socket.on('loadPrivateChat', async ({ from, to, room }) => {
    const messages = await PrivateMessage.find({ room }).sort({ timestamp: 1 });
    socket.emit('loadPrivateMessages', messages);
  });

  // Handle private messages
  socket.on('privateMessage', async ({ from, to, message, room }) => {
    const newMessage = new PrivateMessage({
      room,
      sender: from,
      receiver: to,
      message,
      unread: true,
    });
    await newMessage.save();

    // Emit message to both users in the room
    io.to(room).emit('privateMessage', { user: from, text: message, room });

    // Notify both sender and receiver with unread message count
    const unreadMessagesReceiver = await PrivateMessage.countDocuments({ receiver: to, unread: true });
    io.to(to).emit('unreadNotification', unreadMessagesReceiver);

    // Update the sender as well with their unread messages count
    const unreadMessagesSender = await PrivateMessage.countDocuments({ receiver: from, unread: true });
    socket.emit('unreadNotification', unreadMessagesSender);
  });

  // Mark messages as read when a user opens a private chat
  socket.on('markAsRead', async (room) => {
    const username = socket.handshake.session.username;
    await PrivateMessage.updateMany({ room, receiver: username, unread: true }, { unread: false });

    // Update unread count for the user
    const unreadMessages = await PrivateMessage.countDocuments({ receiver: username, unread: true });
    socket.emit('unreadNotification', unreadMessages);
  });


 
  // Mark the user as online
  usersOnline[username] = { status: 'Online' };
  io.emit('userOnlineUpdate', usersOnline);  // Notify all clients

  // When a user comes online
  socket.on('userOnline', (username) => {
    usersOnline[username] = { status: 'Online' };
    io.emit('userOnlineUpdate', usersOnline);
  });


// When a user starts typing (public or private)
socket.on('typing', ({ username, room }) => {
  // Broadcast the typing event only to users in the specific room
  io.to(room).emit('typing', username);
});


  
  // When a user disconnects
  socket.on('disconnect', () => {
    if (username) {
      usersOnline[username] = { status: 'Offline' };
      io.emit('userOnlineUpdate', usersOnline);  // Notify all clients
      console.log('User disconnected:', username);
    }
  });
  
  // When the user goes offline explicitly (e.g., closing the tab)
  socket.on('userOffline', (username) => {
    usersOnline[username] = { status: 'Offline' };
    io.emit('userOnlineUpdate', usersOnline);  // Notify all clients
  });




});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));








































