// controllers/authController.js

const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;
  
    try {
      // Check if user exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      // Create new user
      const user = await User.create({
        username,
        email,
        password,
      });
  
      // After successful registration, redirect to login page
      res.redirect('/api/auth/login'); // Assuming your login page route is /api/auth/login
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Find user by email
      const user = await User.findOne({ email });
  
      // Check if user exists and password matches
      if (user && (await user.matchPassword(password))) {
        // Generate a JWT token
        const token = generateToken(user._id);
  
        // Store the token and username in session
        req.session.token = token;
        req.session.username = user.username;  // Store the username
  
        // Redirect to chatroom after successful login
        res.redirect('/chatroom');
      } else {
        // Invalid login attempt
        res.status(400).json({ message: 'Invalid email or password' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  







// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Public
exports.logoutUser = (req, res) => {
  // Clear the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    
    // Optionally clear the cookie for token
    res.clearCookie('connect.sid'); // assuming you're using the default session cookie name

    // Redirect to the login page
    res.redirect('/');
  });
};
