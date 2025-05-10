const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Lease = require('../models/Lease');
const authMiddleware = require('../middleware/auth');

// Get payment history for a tenant
router.get('/tenant/:tenantId', authMiddleware, async (req, res) => {
  try {
    console.log(`Fetching payments for tenantId: ${req.params.tenantId}`); // Debug log
    if (req.user.id !== req.params.tenantId) {
      return res.status(403).json({ message: 'Unauthorized: You can only view your own payment history' });
    }

    const payments = await Payment.find({ tenantId: req.params.tenantId }).sort({ paymentDate: -1 });
    res.status(200).json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit a new payment
router.post('/', authMiddleware, async (req, res) => {
  const { tenantId, leaseId, amount, paymentMethod } = req.body;

  try {
    console.log('Received POST request to /api/payments with body:', req.body);
    if (!tenantId || !leaseId || !amount || !paymentMethod) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (req.user.id !== tenantId) {
      return res.status(403).json({ message: 'Unauthorized: You can only make payments for your own lease' });
    }

    const lease = await Lease.findOne({ _id: leaseId, tenantId });
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than 0' });
    }
    if (amount > lease.balance) {
      return res.status(400).json({ message: 'Payment amount cannot exceed the lease balance' });
    }

    const payment = new Payment({
      tenantId,
      leaseId,
      amount,
      paymentMethod,
    });

    await payment.save();

    lease.balance -= amount;
    await lease.save();

    res.status(201).json({ message: 'Payment submitted successfully', payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;