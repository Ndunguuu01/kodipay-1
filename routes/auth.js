const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register a new user
router.post('/register', async (req, res) => {
  const { phoneNumber, password, role } = req.body;

  try {
    console.log('Register request received:', req.body);
    let user = await User.findOne({ phoneNumber });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      phoneNumber,
      password,
      role: role || 'tenant',
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    console.log('User registered successfully:', user);

    const payload = {
      id: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' }); // Short-lived access token
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }); // Long-lived refresh token

    res.status(201).json({
      id: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role,
      token,
      refreshToken,
    });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login a user
router.post('/login', async (req, res) => {
  const { phoneNumber, password } = req.body;

  try {
    console.log('Login request received:', req.body);
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      id: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' }); // Short-lived access token
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }); // Long-lived refresh token

    res.status(200).json({
      id: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role,
      token,
      refreshToken,
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    console.log('Refresh token decoded:', decoded);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const payload = {
      id: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };

    const newToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const newRefreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error('Error during token refresh:', err.message);
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

module.exports = router;