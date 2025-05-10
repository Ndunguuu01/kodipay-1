const Property = require('../models/Property');
const asyncHandler = require('express-async-handler');

// Get all properties (for landlords)
exports.getProperties = asyncHandler(async (req, res) => {
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const properties = await Property.find({ landlord: req.user.id });
  res.json(properties);
});

// Create a new property (for landlords)
exports.createProperty = asyncHandler(async (req, res) => {
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const {
    name,
    address,
    rentAmount,
    description = null,
    floors = [],
  } = req.body;

  console.log("Received body:", req.body);

  const property = new Property({
    landlordId: req.user.id,
    name,
    address,
    rentAmount,
    description,
    floors,
  });
  await property.save();
  res.status(201).json(property);
});

// Get a specific property by ID
exports.getPropertyById = asyncHandler(async (req, res) => {
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }
  if (property.landlord.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  res.json(property);
});

// Update a property
exports.updateProperty = asyncHandler(async (req, res) => {
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }
  if (property.landlord.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const { name, location, houseNumber, apartment } = req.body;
  property.name = name || property.name;
  property.location = location || property.location;
  property.houseNumber = houseNumber || property.houseNumber;
  property.apartment = apartment || property.apartment;
  await property.save();
  res.json(property);
});

// Delete a property
exports.deleteProperty = asyncHandler(async (req, res) => {
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }
  if (property.landlord.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  await property.remove();
  res.json({ message: 'Property deleted' });
});