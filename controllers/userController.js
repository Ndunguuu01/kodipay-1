const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// Get all users (e.g., for landlords to view tenants)
exports.getUsers = asyncHandler(async (req, res) => {
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const users = await User.find({ role: 'tenant' });
  res.json(users);
});

// Get a specific user by ID
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
});

// Update a user
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (req.user.role !== 'landlord' && req.user.id !== user.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const { firstName, lastName, phoneNumber, apartment, houseNumber } = req.body;
  user.firstName = firstName || user.firstName;
  user.lastName = lastName || user.lastName;
  user.phoneNumber = phoneNumber || user.phoneNumber;
  user.apartment = apartment || user.apartment;
  user.houseNumber = houseNumber || user.houseNumber;
  await user.save();
  res.json(user);
});