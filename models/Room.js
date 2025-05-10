const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isOccupied: { type: Boolean, default: false },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  propertyId: { type: String, ref: 'Property', required: true },
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
