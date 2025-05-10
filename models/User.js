const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['tenant', 'landlord'], required: true },
  apartment: { type: String },
  houseNumber: { type: String },
  mpesaNumber: { type: String },
});

module.exports = mongoose.model('User', userSchema);