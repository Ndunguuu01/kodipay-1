const Lease = require('../models/Lease');

// Create a new lease
exports.createLease = async (req, res) => {
  try {
    const { tenant, property, startDate, endDate, rentAmount } = req.body;

    const newLease = new Lease({
      tenant,
      property,
      startDate,
      endDate,
      rentAmount,
    });

    const savedLease = await newLease.save();
    res.status(201).json(savedLease);
  } catch (error) {
    console.error('Error creating lease:', error);
    res.status(500).json({ message: 'Failed to create lease' });
  }
};

// Get lease by tenant ID
exports.getLeaseByTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const lease = await Lease.findOne({ tenant: tenantId });

    if (!lease) {
      return res.status(404).json({ message: 'Lease not found for tenant' });
    }

    res.status(200).json({
      id: lease._id,
      leaseType: 'Fixed', // Static for now, or make it dynamic if needed
      amount: lease.rentAmount,
      startDate: lease.startDate,
      dueDate: lease.endDate,
      balance: 0, // Update logic if needed
      payableAmount: lease.rentAmount,
      propertyId: lease.property.toString(), // Important for frontend
    });
  } catch (error) {
    console.error('Error fetching lease:', error);
    res.status(500).json({ message: 'Failed to fetch lease' });
  }
};

// Get all leases (optional)
exports.getAllLeases = async (req, res) => {
  try {
    const leases = await Lease.find().populate('tenant property');
    res.status(200).json(leases);
  } catch (error) {
    console.error('Error fetching leases:', error);
    res.status(500).json({ message: 'Failed to fetch leases' });
  }
};

// Delete lease
exports.deleteLease = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Lease.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Lease not found' });
    }
    res.status(200).json({ message: 'Lease deleted' });
  } catch (error) {
    console.error('Error deleting lease:', error);
    res.status(500).json({ message: 'Failed to delete lease' });
  }
};
