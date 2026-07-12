const express = require('express');
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', listCategories);
router.post('/', authorize('Admin'), createCategory);
router.patch('/:id', authorize('Admin'), updateCategory);
router.delete('/:id', authorize('Admin'), deleteCategory);

module.exports = router;
