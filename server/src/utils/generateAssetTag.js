const { nextSequence } = require('../models/Counter');

// Produces AF-0001, AF-0002, ... using the atomic Counter collection.
async function generateAssetTag() {
  const seq = await nextSequence('assetTag');
  return `AF-${String(seq).padStart(4, '0')}`;
}

module.exports = generateAssetTag;
