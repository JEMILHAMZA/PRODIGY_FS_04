

// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser } = require('../controllers/authController');


// GET registration page at root "/"
router.get('/', (req, res) => {
  res.render('register');
});

// GET login page
router.get('/login', (req, res) => {
  res.render('login');
});

// POST register logic
router.post('/register', registerUser);

// POST login logic
router.post('/login', loginUser);


// Add the logout route
router.get('/logout', logoutUser);




module.exports = router;


