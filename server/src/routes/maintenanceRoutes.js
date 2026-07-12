const express = require('express');
const {
  raiseRequest,
  listRequests,
  decideRequest,
  assignTechnician,
  startProgress,
  resolveRequest,
} = require('../controllers/maintenanceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', listRequests);
router.post('/', raiseRequest); // any holder can raise
router.patch('/:id/decision', authorize('Admin', 'AssetManager'), decideRequest);
router.patch('/:id/assign-technician', authorize('Admin', 'AssetManager'), assignTechnician);
router.patch('/:id/start', authorize('Admin', 'AssetManager'), startProgress);
router.patch('/:id/resolve', authorize('Admin', 'AssetManager'), resolveRequest);

module.exports = router;
