const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');
const Lease = require('../models/Lease');
const mongoose = require('mongoose');

// POST /tenants - Create a new tenant
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, nationalId } = req.body;

    const newTenant = new Tenant({ name, phone, email, nationalId });
    await newTenant.save();

    res.status(201).json(newTenant);
  } catch (err) {
    console.error('Tenant creation error:', err.message);
    res.status(500).json({ message: 'Failed to create tenant' });
  }
});

// GET /tenants/:tenantId/lease - Fetch the most recent lease for a tenant
router.get('/:tenantId/lease', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.tenantId)) {
      return res.status(400).json({ message: 'Invalid tenant ID' });
    }

    console.log('Fetching tenant with ID:', req.params.tenantId);
    const tenant = await Tenant.findById(req.params.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    console.log('Tenant found:', tenant);

    console.log('Fetching lease for tenantId:', req.params.tenantId);
    const lease = await Lease.findOne({ tenantId: req.params.tenantId })
      .sort({ createdAt: -1 });
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found for this tenant' });
    }

    res.status(200).json(lease);
  } catch (err) {
    console.error('Error fetching lease:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;