const express = require('express');
const router = express.Router();
const Lease = require('../models/Lease');

// Get all leases
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all leases');
    const leases = await Lease.find().populate('tenant').populate('property');
    res.status(200).json(leases);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get lease by tenant ID
router.get('/tenant/:tenantId', async (req, res) => {
  try {
    const lease = await Lease.findOne({ tenant: req.params.tenantId }).populate('property');
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    res.status(200).json({
      id: lease._id,
      leaseType: 'Fixed', // Adjust as needed
      amount: lease.rentAmount,
      startDate: lease.startDate,
      dueDate: lease.endDate,
      balance: 0, // Placeholder for balance logic
      payableAmount: lease.rentAmount,
      propertyId: lease.property._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new lease
router.post('/', async (req, res) => {
  const { tenant, property, startDate, endDate, rentAmount } = req.body;

  try {
    if (!tenant || !property || !startDate || !endDate || !rentAmount) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const lease = new Lease({
      tenant,
      property,
      startDate,
      endDate,
      rentAmount,
    });

    await lease.save();
    res.status(201).json({ message: 'Lease created successfully', lease });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
