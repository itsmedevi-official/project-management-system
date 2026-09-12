const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { run, get } = require('../config/db');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Helper to validate email format
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    // Validation
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check existing email
    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(409).json({ error: 'Email address is already registered.' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = await run(
      'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)',
      [full_name.trim(), email.toLowerCase().trim(), hashedPassword]
    );

    const user = {
      id: result.lastID,
      full_name: full_name.trim(),
      email: email.toLowerCase().trim()
    };

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userData = {
      id: user.id,
      full_name: user.full_name,
      email: user.email
    };

    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // Client handles token removal
  res.status(200).json({ message: 'Logout successful.' });
});

module.exports = router;
