const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String,},
  property: { type: String, ref: 'Property', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room'},
  nationalId: { type: String },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Tenant', tenantSchema);
