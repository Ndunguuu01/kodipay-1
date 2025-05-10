const Bill = require('../models/Bill');

exports.createBill = async (req, res) => {
  const { tenantId, amount, description, dueDate } = req.body;

  if (req.user.role !== 'landlord') {
    return res.status(403).json({ message: 'Only landlords can create bills' });
  }

  try {
    const bill = new Bill({
      tenant: tenantId,
      amount,
      description,
      property: propertyId,
      dueDate,
    });

    await bill.save();
    res.status(201).json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBills = async (req, res) => {
  try {
    let bills;
    if (req.user.role === 'tenant') {
      bills = await Bill.find({ tenant: req.user.id }).populate('tenant');
    } else {
      bills = await Bill.find().populate('tenant');
    }
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};