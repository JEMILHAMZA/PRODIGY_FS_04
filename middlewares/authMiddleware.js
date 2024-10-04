
// middlewares/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check if token is stored in session
  if (req.session.token) {
    try {
      token = req.session.token;

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get the user from the token
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};
