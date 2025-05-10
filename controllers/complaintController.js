const Complaint = require('../models/Complaint');
const asyncHandler = require('express-async-handler');

// Get all complaints (for tenants or landlords)
exports.getComplaints = asyncHandler(async (req, res) => {
  let complaints;
  if (req.user.role === 'tenant') {
    // Tenants can only see their own complaints
    complaints = await Complaint.find({ tenant: req.user.id });
  } else if (req.user.role === 'landlord') {
    // Landlords can see complaints from their tenants
    complaints = await Complaint.find()
      .populate('tenant', 'firstName lastName houseNumber apartment')
      .where('tenant.houseNumber')
      .in(
        await Property.find({ landlord: req.user.id }).distinct('houseNumber')
      );
  } else {
    return res.status(403).json({ message: 'Not authorized' });
  }
  res.json(complaints);
});

// Create a new complaint (for tenants)
exports.createComplaint = asyncHandler(async (req, res) => {
  if (req.user.role !== 'tenant') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const { description } = req.body;
  const complaint = new Complaint({
    tenant: req.user.id,
    description,
  });
  await complaint.save();
  res.status(201).json(complaint);
});

// Get a specific complaint by ID
exports.getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id).populate(
    'tenant',
    'firstName lastName houseNumber apartment'
  );
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }
  if (
    req.user.role === 'tenant' &&
    complaint.tenant._id.toString() !== req.user.id
  ) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  if (req.user.role === 'landlord') {
    const property = await Property.findOne({
      landlord: req.user.id,
      houseNumber: complaint.tenant.houseNumber,
    });
    if (!property) {
      return res.status(403).json({ message: 'Not authorized' });
    }
  }
  res.json(complaint);
});

// Update a complaint (e.g., mark as resolved by landlord)
exports.updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id).populate(
    'tenant',
    'houseNumber'
  );
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const property = await Property.findOne({
    landlord: req.user.id,
    houseNumber: complaint.tenant.houseNumber,
  });
  if (!property) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const { status } = req.body;
  complaint.status = status || complaint.status;
  await complaint.save();
  res.json(complaint);
});

// Delete a complaint (for tenants or landlords)
exports.deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id).populate(
    'tenant',
    'houseNumber'
  );
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }
  if (req.user.role === 'tenant' && complaint.tenant._id.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  if (req.user.role === 'landlord') {
    const property = await Property.findOne({
      landlord: req.user.id,
      houseNumber: complaint.tenant.houseNumber,
    });
    if (!property) {
      return res.status(403).json({ message: 'Not authorized' });
    }
  }
  await complaint.remove();
  res.json({ message: 'Complaint deleted' });
});