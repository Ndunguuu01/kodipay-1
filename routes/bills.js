const express = require('express');
const Bill = require('../models/Bill');
const router = express.Router();
const mongoose = require('mongoose');

// POST /bills - Create a new bill
router.post('/', async (req, res) => {
  try {
    const { 
      tenantId,
      amount,
      description,
      dueDate,
      status = 'pending',
      type
    } = req.body;

    // Validate tenantId
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({ message: 'Invalid tenant ID' });
    }

    const newBill = new Bill({
      tenantId,
      amount,
      description,
      dueDate,
      status,
      type
    });

    await newBill.save();
    res.status(201).json(newBill);
  } catch (err) {
    console.error('Bill creation error:', err.message);
    res.status(500).json({ message: 'Failed to create bill' });
  }
});

// GET /api/bills/tenant/:tenantId
router.get('/tenant/:tenantId', async (req, res) => {
    try {
      const bills = await Bill.find({ tenant: req.params.tenantId })
        .populate('property')
        .sort({ dueDate: -1 }); // Optional: sort by most recent first
      res.json(bills);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

// Get all bills for a landlord (via properties they own)
router.get('/landlord/:landlordId', async (req, res) => {
  try {
    const bills = await Bill.find()
      .populate('tenant')
      .populate({
        path: 'property',
        match: { landlord: req.params.landlordId },
      });

    // Filter out bills where the populated property is null
    const filteredBills = bills.filter(bill => bill.property !== null);

    res.json(filteredBills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark a bill as paid
router.put('/:id/pay', async (req, res) => {
  try {
    const updatedBill = await Bill.findByIdAndUpdate(
      req.params.id,
      { status: 'Paid' },
      { new: true }
    );
    res.json(updatedBill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bills?landlordId=xxx&status=paid&type=Rent&startDate=2024-04-01&endDate=2024-04-30&tenantName=john
router.get('/', async (req, res) => {
    try {
      const { landlordId, status, type, startDate, endDate, tenantName } = req.query;
      let query = {};
  
      // Filter by landlord's properties
      if (landlordId) {
        const properties = await Property.find({ landlord: landlordId }).select('_id');
        const propertyIds = properties.map((p) => p._id);
        query.property = { $in: propertyIds };
      }
  
      if (status) query.status = status;
      if (type) query.type = type;
  
      // Filter by due date range
      if (startDate || endDate) {
        query.dueDate = {};
        if (startDate) query.dueDate.$gte = new Date(startDate);
        if (endDate) query.dueDate.$lte = new Date(endDate);
      }
  
      // Initial query for bills
      let billsQuery = Bill.find(query).populate('property tenant');
  
      let bills = await billsQuery.exec();
  
      // Filter by tenant name (case-insensitive partial match)
      if (tenantName) {
        const search = tenantName.toLowerCase();
        bills = bills.filter((bill) => {
          const fullName = `${bill.tenant?.firstName ?? ''} ${bill.tenant?.lastName ?? ''}`.toLowerCase();
          return fullName.includes(search);
        });
      }
  
      res.json(bills);
    } catch (err) {
      console.error('Error filtering bills:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  });

module.exports = router;
