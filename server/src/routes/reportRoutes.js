const express = require('express');
const {
  utilizationReport,
  maintenanceFrequencyReport,
  lifecycleOutlookReport,
  departmentAllocationReport,
  bookingHeatmapReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin', 'AssetManager', 'DepartmentHead'));

router.get('/utilization', utilizationReport);
router.get('/maintenance-frequency', maintenanceFrequencyReport);
router.get('/lifecycle-outlook', lifecycleOutlookReport);
router.get('/department-allocation', departmentAllocationReport);
router.get('/booking-heatmap', bookingHeatmapReport);

module.exports = router;
