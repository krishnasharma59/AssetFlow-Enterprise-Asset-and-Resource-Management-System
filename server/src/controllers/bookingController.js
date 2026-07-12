const Asset = require('../models/Asset');
const Booking = require('../models/Booking');
const { asyncHandler } = require('../middleware/errorHandler');
const { notify, logActivity } = require('../utils/events');

// Two bookings overlap if existing.start < newEnd AND existing.end > newStart.
// A booking starting exactly when another ends is fine (10:00-11:00 after 9:00-10:00).
async function hasOverlap(resourceId, start, end, excludeBookingId = null) {
  const filter = {
    resource: resourceId,
    status: { $in: ['Upcoming', 'Ongoing'] },
    startTime: { $lt: end },
    endTime: { $gt: start },
  };
  if (excludeBookingId) filter._id = { $ne: excludeBookingId };
  const conflict = await Booking.findOne(filter);
  return conflict;
}

// @route POST /api/bookings
const createBooking = asyncHandler(async (req, res) => {
  const { resourceId, startTime, endTime, purpose, onBehalfOfDepartment } = req.body;
  if (!resourceId || !startTime || !endTime) {
    return res.status(400).json({ message: 'resourceId, startTime and endTime are required' });
  }
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (end <= start) return res.status(400).json({ message: 'endTime must be after startTime' });

  const resource = await Asset.findById(resourceId);
  if (!resource) return res.status(404).json({ message: 'Resource not found' });
  if (!resource.isBookable) return res.status(400).json({ message: 'This asset is not flagged as a bookable resource' });

  const conflict = await hasOverlap(resourceId, start, end);
  if (conflict) {
    return res.status(409).json({
      message: `${resource.name} is already booked from ${conflict.startTime.toISOString()} to ${conflict.endTime.toISOString()}, which overlaps your request`,
      code: 'BOOKING_OVERLAP',
      conflict,
    });
  }

  const booking = await Booking.create({
    resource: resourceId,
    bookedBy: req.user._id,
    onBehalfOfDepartment: onBehalfOfDepartment || null,
    purpose: purpose || '',
    startTime: start,
    endTime: end,
    status: 'Upcoming',
  });

  await notify(req.user._id, 'Booking Confirmed', `Your booking for ${resource.name} is confirmed for ${start.toLocaleString()}`, 'Booking', booking._id);
  await logActivity(req.user._id, 'Booked resource', 'Booking', booking._id, resource.name);

  res.status(201).json(booking);
});

// @route GET /api/bookings  (calendar view feed - filter by resource + date range)
const listBookings = asyncHandler(async (req, res) => {
  const { resource, from, to, status, mine } = req.query;
  const filter = {};
  if (resource) filter.resource = resource;
  if (status) filter.status = status;
  if (mine === 'true') filter.bookedBy = req.user._id;
  if (from || to) {
    filter.startTime = {};
    if (from) filter.startTime.$gte = new Date(from);
    if (to) filter.startTime.$lte = new Date(to);
  }

  // Lazily refresh status of anything whose window has passed / started
  const now = new Date();
  await Booking.updateMany(
    { status: 'Upcoming', startTime: { $lte: now }, endTime: { $gt: now } },
    { status: 'Ongoing' }
  );
  await Booking.updateMany(
    { status: { $in: ['Upcoming', 'Ongoing'] }, endTime: { $lte: now } },
    { status: 'Completed' }
  );

  const bookings = await Booking.find(filter)
    .populate('resource', 'assetTag name location')
    .populate('bookedBy', 'name email')
    .populate('onBehalfOfDepartment', 'name')
    .sort({ startTime: 1 });

  res.json(bookings);
});

// @route PATCH /api/bookings/:id/cancel
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('resource', 'name');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (['Completed', 'Cancelled'].includes(booking.status)) {
    return res.status(409).json({ message: `Booking is already ${booking.status}` });
  }
  booking.status = 'Cancelled';
  await booking.save();

  await notify(booking.bookedBy, 'Booking Cancelled', `Your booking for ${booking.resource.name} was cancelled`);
  await logActivity(req.user._id, 'Cancelled booking', 'Booking', booking._id);
  res.json(booking);
});

// @route PATCH /api/bookings/:id/reschedule
const rescheduleBooking = asyncHandler(async (req, res) => {
  const { startTime, endTime } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (['Completed', 'Cancelled'].includes(booking.status)) {
    return res.status(409).json({ message: `Booking is already ${booking.status}` });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (end <= start) return res.status(400).json({ message: 'endTime must be after startTime' });

  const conflict = await hasOverlap(booking.resource, start, end, booking._id);
  if (conflict) {
    return res.status(409).json({ message: 'The new time slot overlaps an existing booking', code: 'BOOKING_OVERLAP' });
  }

  booking.startTime = start;
  booking.endTime = end;
  booking.status = 'Upcoming';
  booking.reminderSent = false;
  await booking.save();

  await logActivity(req.user._id, 'Rescheduled booking', 'Booking', booking._id);
  res.json(booking);
});

module.exports = { createBooking, listBookings, cancelBooking, rescheduleBooking };
