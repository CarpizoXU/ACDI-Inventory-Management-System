const PhysicalCount = require('../models/PhysicalCount');

async function createPhysicalCount({ referenceNumber, countedBy, location, items, notes }) {
  const physicalCount = new PhysicalCount({
    referenceNumber,
    countedBy,
    location,
    items,
    notes,
    status: 'draft',
  });
  return physicalCount.save().populate('items.product');
}

async function getPhysicalCountById(id) {
  return PhysicalCount.findById(id).populate('items.product');
}

async function getPhysicalCountByReference(referenceNumber) {
  return PhysicalCount.findOne({ referenceNumber }).populate('items.product');
}

async function getAllPhysicalCounts(filters = {}) {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.countedBy) query.countedBy = filters.countedBy;

  return PhysicalCount.find(query)
    .sort({ createdAt: -1 })
    .populate('items.product');
}

async function updatePhysicalCount(id, updates) {
  const physicalCount = await PhysicalCount.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate('items.product');

  return physicalCount;
}

async function submitPhysicalCount(id) {
  return PhysicalCount.findByIdAndUpdate(
    id,
    {
      status: 'submitted',
      submittedAt: new Date(),
    },
    { new: true, runValidators: true }
  ).populate('items.product');
}

async function reconcilePhysicalCount(id, reconciledBy) {
  return PhysicalCount.findByIdAndUpdate(
    id,
    {
      status: 'reconciled',
      reconciledAt: new Date(),
      reconciledBy,
    },
    { new: true, runValidators: true }
  ).populate('items.product');
}

async function deletePhysicalCount(id) {
  return PhysicalCount.findByIdAndDelete(id);
}

module.exports = {
  createPhysicalCount,
  getPhysicalCountById,
  getPhysicalCountByReference,
  getAllPhysicalCounts,
  updatePhysicalCount,
  submitPhysicalCount,
  reconcilePhysicalCount,
  deletePhysicalCount,
};
