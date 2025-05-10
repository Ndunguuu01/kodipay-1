
const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const User = require('../models/User');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    console.log('POST /properties - Request body:', req.body);
    console.log('Authenticated user:', req.user);
    console.log('Landlord ID from token:', req.user.id); 
    console.log('Decoded user from token:', req.user);

    const landlordId = req.user.id;

    const { name, address, rentAmount, description, floors } = req.body;

    if (req.user.id !== landlordId) {
      return res.status(403).json({ message: 'Unauthorized: You can only add properties for yourself' });
    }

    const property = new Property({
      landlordId,
      name,
      address,
      rentAmount,
      description,
      floors,
    });

    await property.save();
    console.log('Property added:', property);
    res.status(201).json(property);
  } catch (error) {
    console.error('Error adding property:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/landlord', auth, async (req, res) => {
  try {
    const properties = await Property.find({ landlordId: req.user.id }).lean();

    // Calculate occupied rooms
    const updatedProperties = properties.map(property => {
      let occupiedRooms = 0;
      const updatedFloors = property.floors.map(floor => {
        const updatedRooms = floor.rooms.map(room => {
          if (room.isOccupied) {
            occupiedRooms++;
          }
          return room;
        });
        return { ...floor, rooms: updatedRooms };
      });
      return { ...property, floors: updatedFloors, occupiedRooms };
    });

    console.log('GET /properties/landlord - Landlord ID:', req.user.id);
    console.log('Properties found:', updatedProperties);
    res.status(200).json(updatedProperties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id/assign-tenant', auth, async (req, res) => {
  const { id } = req.params;
  const { floorNumber, roomNumber, tenantId } = req.body;

  try {
    // Find the property
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Verify the landlord owns the property
    if (property.landlordId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Find the floor and room
    const floor = property.floors.find(f => f.floorNumber === floorNumber);
    if (!floor) {
      return res.status(404).json({ message: 'Floor not found' });
    }

    const room = floor.rooms.find(r => r.roomNumber === roomNumber);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Verify the tenant exists
    const tenant = await User.findById(tenantId);
    if (!tenant || tenant.role !== 'tenant') {
      return res.status(400).json({ message: 'Invalid tenant' });
    }

    // Check if the room is already occupied
    if (room.isOccupied || room.tenantId) {
      return res.status(400).json({ message: 'Room is already assigned' });
    }

    // Assign the tenant to the room
    room.tenantId = tenantId;
    room.isOccupied = true;
    await property.save();

    // Send a notification to the tenant via Socket.io
    const message = new Message({
      sender: req.user.id,
      recipient: tenantId,
      content: `You have been assigned to room ${roomNumber} on floor ${floorNumber} in property ${property.name}.`,
      isGroupMessage: false,
    });
    await message.save();

    const roomId = [req.user.id, tenantId].sort().join('_');
    if (req.io) {
      console.log(`Emitting directMessage to room ${roomId}`);
      req.io.to(roomId).emit('directMessage', {
        sender: req.user.id,
        recipient: tenantId,
        content: message.content,
        timestamp: message.timestamp,
      });
    } else {
      console.error('Socket.io instance (req.io) is undefined. Cannot send notification.');
    }

    res.status(200).json({ message: 'Tenant assigned successfully' });
  } catch (error) {
    console.error('Error assigning tenant:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:propertyId/unassign', auth, async (req, res) => {
  try {
    const { floorNumber, roomNumber } = req.body;

    const property = await Property.findById(req.params.propertyId);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    // Verify the landlord owns the property
    if (property.landlordId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Find the floor and room
    const floor = property.floors.find(f => f.floorNumber === floorNumber);
    if (!floor) {
      return res.status(404).json({ message: 'Floor not found' });
    }

    const room = floor.rooms.find(r => r.roomNumber === roomNumber);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if the room is occupied
    if (!room.isOccupied || !room.tenantId) {
      return res.status(400).json({ message: 'Room is not occupied' });
    }

    // Unassign the tenant
    room.tenantId = null;
    room.isOccupied = false;
    await property.save();

    res.status(200).json({ message: 'Tenant unassigned successfully' });
  } catch (err) {
    console.error('Unassign tenant error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:propertyId', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.propertyId);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.landlordId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Property.findByIdAndDelete(req.params.propertyId);
    res.status(200).json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
