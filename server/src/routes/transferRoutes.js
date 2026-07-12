const express = require('express');
const { requestTransfer, listTransfers, decideTransfer } = require('../controllers/allocationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', listTransfers);
router.post('/', requestTransfer); // any authenticated holder can initiate
router.patch('/:id/decision', authorize('Admin', 'AssetManager', 'DepartmentHead'), decideTransfer);

module.exports = router;
