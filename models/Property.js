const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isOccupied: { type: Boolean, default: false },
});

const floorSchema = new mongoose.Schema({
  floorNumber: { type: Number, required: true },
  rooms: [roomSchema],
});

const propertySchema = new mongoose.Schema(
  {
    landlordId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    rentAmount: { type: Number, required: true },
    description: { type: String },
    floors: [floorSchema],
  },
  { timestamps: true }
);

// Add index on landlordId for faster queries
propertySchema.index({ landlordId: 1 });

// Pre-save hook to ensure isOccupied aligns with tenantId
roomSchema.pre('save', function (next) {
  this.isOccupied = !!this.tenantId; // Set isOccupied to true if tenantId exists, false otherwise
  next();
});

module.exports = mongoose.model('Property', propertySchema);