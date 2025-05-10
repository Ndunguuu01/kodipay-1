const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// ✅ Add this specific route first
router.get('/tenants', auth, userController.getUsers);

// Get all users (for landlords to view tenants)
router.get('/', auth, userController.getUsers);

// Get a specific user by ID
router.get('/:id', auth, userController.getUserById);

// Update a user
router.put('/:id', auth, userController.updateUser);

module.exports = router;