


// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const User = require('../models/userModel');

// GET chatroom page (protected route)
router.get('/chatroom', protect, async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find().select('username');

    // Render the chatroom page with the current username and the list of users
    res.render('chatroom', { username: req.session.username, users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load users' });
  }
});

module.exports = router;
