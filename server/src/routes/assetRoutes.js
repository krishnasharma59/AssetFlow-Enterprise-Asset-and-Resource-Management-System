const express = require('express');
const {
  registerAsset,
  listAssets,
  getAsset,
  getAssetHistory,
  updateAsset,
  changeAssetStatus,
  deleteAsset,
} = require('../controllers/assetController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', listAssets);
router.post('/', authorize('Admin', 'AssetManager'), registerAsset);
router.get('/:id', getAsset);
router.get('/:id/history', getAssetHistory);
router.patch('/:id', authorize('Admin', 'AssetManager'), updateAsset);
router.patch('/:id/status', authorize('Admin', 'AssetManager'), changeAssetStatus);
router.delete('/:id', authorize('Admin', 'AssetManager'), deleteAsset);

module.exports = router;
