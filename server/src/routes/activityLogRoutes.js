const express = require('express');
const { listActivityLogs } = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', authorize('Admin', 'AssetManager', 'DepartmentHead'), listActivityLogs);

module.exports = router;
