const Asset = require('../models/Asset');
const Allocation = require('../models/Allocation');
const Booking = require('../models/Booking');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const TransferRequest = require('../models/TransferRequest');
const { asyncHandler } = require('../middleware/errorHandler');

// @route GET /api/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    assetsAvailable,
    assetsAllocated,
    maintenanceToday,
    activeBookings,
    pendingTransfers,
    upcomingReturns,
    overdueReturns,
    overdueBookingsCount,
  ] = await Promise.all([
    Asset.countDocuments({ status: 'Available' }),
    Asset.countDocuments({ status: 'Allocated' }),
    MaintenanceRequest.countDocuments({
      status: { $in: ['Approved', 'Technician Assigned', 'In Progress'] },
      updatedAt: { $gte: startOfDay, $lt: endOfDay },
    }),
    Booking.countDocuments({ status: { $in: ['Upcoming', 'Ongoing'] } }),
    TransferRequest.countDocuments({ status: 'Requested' }),
    Allocation.countDocuments({
      status: 'Active',
      expectedReturnDate: { $gte: now, $lte: sevenDaysOut },
    }),
    Allocation.countDocuments({ status: 'Active', expectedReturnDate: { $lt: now } }),
    Booking.countDocuments({ status: 'Upcoming', startTime: { $lt: now } }),
  ]);

  const overdueAllocations = await Allocation.find({ status: 'Active', expectedReturnDate: { $lt: now } })
    .populate('asset', 'assetTag name')
    .populate('allocatedToUser', 'name')
    .populate('allocatedToDepartment', 'name')
    .sort({ expectedReturnDate: 1 })
    .limit(20);

  const upcomingReturnsList = await Allocation.find({
    status: 'Active',
    expectedReturnDate: { $gte: now, $lte: sevenDaysOut },
  })
    .populate('asset', 'assetTag name')
    .populate('allocatedToUser', 'name')
    .populate('allocatedToDepartment', 'name')
    .sort({ expectedReturnDate: 1 })
    .limit(20);

  res.json({
    kpis: {
      assetsAvailable,
      assetsAllocated,
      maintenanceToday,
      activeBookings,
      pendingTransfers,
      upcomingReturns,
      overdueReturns,
      overdueBookingsCount,
    },
    overdueAllocations,
    upcomingReturnsList,
  });
});

module.exports = { getDashboard };
