const express = require('express');
const router = express.Router(); 
const Tenant = require('../models/Tenant');  
const Room = require('../models/Room');  
const mongoose = require('mongoose');   



router.post('/:roomId/assign-tenant', async (req, res) => {
  try {
    const { name, phone, email, nationalId } = req.body;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    // Validate roomId format
    if (!mongoose.Types.ObjectId.isValid(req.params.roomId)) {
      return res.status(400).json({ error: 'Invalid room ID' });
    }

    // Fetch the room to get its property
    const room = await Room.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Create the tenant with the room field
    const newTenant = new Tenant({
      name,
      phone,
      email,
      nationalId,
      room: req.params.roomId, 
      property: room.propertyId,
    });
    await newTenant.save();

    // Update the room with the tenant
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.roomId,
      { tenant: newTenant._id, isOccupied: true }, // Room -> Tenant relationship
      { new: true }
    ).populate('tenant');

    if (!updatedRoom) {
      // If the room doesn't exist, delete the tenant to avoid orphaned data
      await Tenant.findByIdAndDelete(newTenant._id);
      return res.status(404).json({ message: 'Room not found' });
    }

    res.status(200).json(room);
  } catch (err) {
    // Handle validation errors specifically
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

  // Assign existing tenant to a room
  router.put('/:roomId/assign-tenant', async (req, res) => {
    try {
      const { tenantId } = req.body;
  
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId is required' });
      }
  
      if (!mongoose.Types.ObjectId.isValid(req.params.roomId)) {
        return res.status(400).json({ error: 'Invalid room ID' });
      }
  
      if (!mongoose.Types.ObjectId.isValid(tenantId)) {
        return res.status(400).json({ error: 'Invalid tenant ID' });
      }

      // Fetch the room to get its property
    const room = await Room.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
  
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
  
      // Check if the tenant is already assigned to another room
      if (tenant.room && tenant.room.toString() !== req.params.roomId) {
        return res.status(400).json({ error: 'Tenant is already assigned to another room' });
      }
  
      // Update the tenant's room field
      tenant.room = req.params.roomId; 
      tenant.property = room.propertyId;
      await tenant.save();
  
      const updatedRoom = await Room.findByIdAndUpdate(
        req.params.roomId,
        { tenant: tenantId, isOccupied: true }, 
        { new: true }
      ).populate('tenant');
  
      if (!updatedRoom) {
        // If the room doesn't exist, revert the tenant's room field
        tenant.room = null;
        tenant.property = null;
        await tenant.save();
        return res.status(404).json({ message: 'Room not found' });
      }
  
      res.status(200).json(updatedRoom);
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ message: err.message });
    }
  });

module.exports = router;
  