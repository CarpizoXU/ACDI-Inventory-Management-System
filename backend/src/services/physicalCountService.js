const physicalCountRepository = require('../repositories/physicalCountRepository');
const productRepository = require('../repositories/productRepository');

function buildReferenceNumber() {
  const now = Date.now();
  const timestamp = now.toString().slice(-8);
  return `PC-${timestamp}`;
}

function calculateTotalVariance(items) {
  return items.reduce((sum, item) => sum + item.variance, 0);
}

async function createPhysicalCount({ countedBy, location, items, notes }) {
  if (!items || items.length === 0) {
    const error = new Error('At least one item is required');
    error.statusCode = 400;
    throw error;
  }

  // Validate and enrich items with system quantities
  const enrichedItems = [];
  for (const item of items) {
    const product = await productRepository.findById(item.product);
    if (!product) {
      const error = new Error(`Product ${item.product} not found`);
      error.statusCode = 404;
      throw error;
    }

    const systemQuantity = product.quantity;
    const variance = item.countedQuantity - systemQuantity;

    enrichedItems.push({
      product: item.product,
      countedQuantity: item.countedQuantity,
      systemQuantity,
      variance,
      notes: item.notes || '',
    });
  }

  const totalVariance = calculateTotalVariance(enrichedItems);
  const referenceNumber = buildReferenceNumber();

  const physicalCount = await physicalCountRepository.createPhysicalCount({
    referenceNumber,
    countedBy,
    location,
    items: enrichedItems,
    notes,
  });

  return {
    ...physicalCount.toObject(),
    totalVariance,
  };
}

async function getPhysicalCountDetail(id) {
  const physicalCount = await physicalCountRepository.getPhysicalCountById(id);
  if (!physicalCount) {
    const error = new Error('Physical count not found');
    error.statusCode = 404;
    throw error;
  }

  return {
    ...physicalCount.toObject(),
    totalVariance: calculateTotalVariance(physicalCount.items),
  };
}

async function listPhysicalCounts(filters = {}) {
  const physicalCounts = await physicalCountRepository.getAllPhysicalCounts(filters);
  return physicalCounts.map(pc => ({
    ...pc.toObject(),
    totalVariance: calculateTotalVariance(pc.items),
  }));
}

async function submitPhysicalCount(id) {
  const physicalCount = await physicalCountRepository.submitPhysicalCount(id);
  if (!physicalCount) {
    const error = new Error('Physical count not found');
    error.statusCode = 404;
    throw error;
  }

  return {
    ...physicalCount.toObject(),
    totalVariance: calculateTotalVariance(physicalCount.items),
  };
}

async function reconcilePhysicalCount(id, reconciledBy) {
  const physicalCount = await physicalCountRepository.reconcilePhysicalCount(id, reconciledBy);
  if (!physicalCount) {
    const error = new Error('Physical count not found');
    error.statusCode = 404;
    throw error;
  }

  // Apply quantity adjustments to products based on physical count variance
  for (const item of physicalCount.items) {
    if (item.variance !== 0) {
      const product = await productRepository.findById(item.product);
      if (product) {
        const newQuantity = product.quantity + item.variance;
        // Determine stock status
        const statusMap = {
          'out-of-stock': newQuantity === 0,
          'critical': newQuantity > 0 && newQuantity <= Math.max(1, Math.floor(product.reorderThreshold / 2)),
          'alert': newQuantity > Math.max(1, Math.floor(product.reorderThreshold / 2)) && newQuantity <= product.reorderThreshold,
          'ok': newQuantity > product.reorderThreshold,
        };
        
        let stockStatus = 'ok';
        if (newQuantity === 0) stockStatus = 'out-of-stock';
        else if (product.reorderThreshold > 0 && newQuantity <= Math.max(1, Math.floor(product.reorderThreshold / 2))) stockStatus = 'critical';
        else if (product.reorderThreshold > 0 && newQuantity <= product.reorderThreshold) stockStatus = 'alert';
        
        // Use updateQuantity which sets lastStockMovementDate
        await productRepository.updateQuantity(item.product, newQuantity, stockStatus, reconciledBy);
      }
    }
  }

  return {
    ...physicalCount.toObject(),
    totalVariance: calculateTotalVariance(physicalCount.items),
  };
}

module.exports = {
  createPhysicalCount,
  getPhysicalCountDetail,
  listPhysicalCounts,
  submitPhysicalCount,
  reconcilePhysicalCount,
};
