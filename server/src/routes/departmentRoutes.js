const express = require('express');
const {
  listDepartments,
  createDepartment,
  updateDepartment,
  deactivateDepartment,
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', listDepartments);
router.post('/', authorize('Admin'), createDepartment);
router.patch('/:id', authorize('Admin'), updateDepartment);
router.patch('/:id/deactivate', authorize('Admin'), deactivateDepartment);

module.exports = router;
