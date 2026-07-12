const express = require('express');
const { listUsers, getUser, updateUser, changeRole } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', listUsers);
router.get('/:id', getUser);
router.patch('/:id', authorize('Admin'), updateUser);
router.patch('/:id/role', authorize('Admin'), changeRole);

module.exports = router;
