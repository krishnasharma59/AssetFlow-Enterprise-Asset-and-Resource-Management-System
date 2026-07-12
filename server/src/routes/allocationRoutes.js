const express = require('express');
const { allocateAsset, listAllocations, returnAsset } = require('../controllers/allocationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', listAllocations);
router.post('/', authorize('Admin', 'AssetManager', 'DepartmentHead'), allocateAsset);
router.post('/:id/return', authorize('Admin', 'AssetManager', 'DepartmentHead'), returnAsset);

module.exports = router;
