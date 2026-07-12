const express = require('express');
const {
  createBooking,
  listBookings,
  cancelBooking,
  rescheduleBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', listBookings);
router.post('/', createBooking);
router.patch('/:id/cancel', cancelBooking);
router.patch('/:id/reschedule', rescheduleBooking);

module.exports = router;
