const express = require('express');
const {
  createAuditCycle,
  listAuditCycles,
  getAuditCycle,
  startAuditCycle,
  markAuditItem,
  getDiscrepancies,
  closeAuditCycle,
} = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', listAuditCycles);
router.post('/', authorize('Admin'), createAuditCycle);
router.get('/:id', getAuditCycle);
router.patch('/:id/start', authorize('Admin'), startAuditCycle);
router.patch('/items/:itemId', markAuditItem); // auditors mark items
router.get('/:id/discrepancies', getDiscrepancies);
router.patch('/:id/close', authorize('Admin'), closeAuditCycle);

module.exports = router;
