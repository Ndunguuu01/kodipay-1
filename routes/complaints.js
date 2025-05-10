const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const auth = require('../middleware/auth');

router.get('/tenant/:tenantId', auth, async (req, res) => {
  try {
    const complaints = await Complaint.find({ tenant: req.params.tenantId })
      .populate('tenant', 'phoneNumber')
      .populate('property', 'name address');
    res.status(200).json(complaints);
  } catch (err) {
    console.error('Error fetching complaints:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/landlord/:landlordId', auth, async (req, res) => {
  try {
    const properties = await require('../models/Property').find({ landlord: req.params.landlordId });
    const propertyIds = properties.map(p => p._id);
    const complaints = await Complaint.find({ property: { $in: propertyIds } })
      .populate('tenant', 'phoneNumber')
      .populate('property', 'name address');
    res.status(200).json(complaints);
  } catch (err) {
    console.error('Error fetching landlord complaints:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  const { title, description, tenant, property } = req.body;

  try {
    const complaint = new Complaint({
      title,
      description,
      tenant,
      property,
      submittedAt: new Date(),
    });
    await complaint.save();
    await complaint.populate('tenant', 'phoneNumber').populate('property', 'name address');
    res.status(201).json(complaint);
  } catch (err) {
    console.error('Error submitting complaint:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { title, description, status, resolutionNotes } = req.body;

  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    if (complaint.tenant.toString() !== req.user.id && req.user.role !== 'landlord') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (title) complaint.title = title;
    if (description) complaint.description = description;
    if (status) complaint.status = status;
    if (status === 'resolved') complaint.resolvedAt = new Date();
    if (resolutionNotes) complaint.resolutionNotes = resolutionNotes;

    await complaint.save();
    await complaint.populate('tenant', 'phoneNumber').populate('property', 'name address');
    res.status(200).json(complaint);
  } catch (err) {
    console.error('Error updating complaint:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    if (complaint.tenant.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Complaint.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Complaint deleted' });
  } catch (err) {
    console.error('Error deleting complaint:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;