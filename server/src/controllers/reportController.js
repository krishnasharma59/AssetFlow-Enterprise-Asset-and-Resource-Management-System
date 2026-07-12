const mongoose = require('mongoose');
const Asset = require('../models/Asset');
const Allocation = require('../models/Allocation');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Booking = require('../models/Booking');
const { asyncHandler } = require('../middleware/errorHandler');

// @route GET /api/reports/utilization  (most-used vs idle assets, by allocation count)
const utilizationReport = asyncHandler(async (req, res) => {
  const usage = await Allocation.aggregate([
    { $group: { _id: '$asset', timesAllocated: { $sum: 1 } } },
    { $sort: { timesAllocated: -1 } },
    { $limit: 25 },
    {
      $lookup: { from: 'assets', localField: '_id', foreignField: '_id', as: 'asset' },
    },
    { $unwind: '$asset' },
    { $project: { timesAllocated: 1, 'asset.assetTag': 1, 'asset.name': 1, 'asset.status': 1 } },
  ]);

  const neverAllocated = await Asset.find({
    _id: { $nin: await Allocation.distinct('asset') },
  }).select('assetTag name status');

  res.json({ mostUsed: usage, idleAssets: neverAllocated });
});

// @route GET /api/reports/maintenance-frequency
const maintenanceFrequencyReport = asyncHandler(async (req, res) => {
  const byAsset = await MaintenanceRequest.aggregate([
    { $group: { _id: '$asset', requestCount: { $sum: 1 } } },
    { $sort: { requestCount: -1 } },
    { $limit: 25 },
    { $lookup: { from: 'assets', localField: '_id', foreignField: '_id', as: 'asset' } },
    { $unwind: '$asset' },
    { $project: { requestCount: 1, 'asset.assetTag': 1, 'asset.name': 1, 'asset.category': 1 } },
  ]);

  const byCategory = await MaintenanceRequest.aggregate([
    { $lookup: { from: 'assets', localField: 'asset', foreignField: '_id', as: 'asset' } },
    { $unwind: '$asset' },
    { $group: { _id: '$asset.category', requestCount: { $sum: 1 } } },
    { $sort: { requestCount: -1 } },
    { $lookup: { from: 'assetcategories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    { $project: { requestCount: 1, 'category.name': 1 } },
  ]);

  res.json({ byAsset, byCategory });
});

// @route GET /api/reports/lifecycle-outlook  (due for maintenance or nearing retirement)
// Heuristic (no dedicated retirement-date field): flag assets acquired 5+ years ago as "nearing
// retirement", and assets with 3+ maintenance requests in the last 6 months as "due for maintenance".
const lifecycleOutlookReport = asyncHandler(async (req, res) => {
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  const nearingRetirement = await Asset.find({
    acquisitionDate: { $lte: fiveYearsAgo },
    status: { $nin: ['Disposed', 'Retired'] },
  }).select('assetTag name acquisitionDate condition status');

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const dueForMaintenance = await MaintenanceRequest.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: '$asset', requestCount: { $sum: 1 } } },
    { $match: { requestCount: { $gte: 3 } } },
    { $lookup: { from: 'assets', localField: '_id', foreignField: '_id', as: 'asset' } },
    { $unwind: '$asset' },
    { $project: { requestCount: 1, 'asset.assetTag': 1, 'asset.name': 1, 'asset.status': 1 } },
  ]);

  res.json({ nearingRetirement, dueForMaintenance });
});

// @route GET /api/reports/department-allocation
const departmentAllocationReport = asyncHandler(async (req, res) => {
  const summary = await Allocation.aggregate([
    { $match: { status: 'Active' } },
    {
      $lookup: { from: 'assets', localField: 'asset', foreignField: '_id', as: 'asset' },
    },
    { $unwind: '$asset' },
    {
      $group: {
        _id: '$asset.department',
        activeAllocations: { $sum: 1 },
        totalCost: { $sum: '$asset.acquisitionCost' },
      },
    },
    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } },
    { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
    { $sort: { activeAllocations: -1 } },
  ]);
  res.json(summary);
});

// @route GET /api/reports/booking-heatmap  (bookings grouped by day-of-week + hour)
const bookingHeatmapReport = asyncHandler(async (req, res) => {
  const heatmap = await Booking.aggregate([
    { $match: { status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: { dayOfWeek: { $dayOfWeek: '$startTime' }, hour: { $hour: '$startTime' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } },
  ]);
  res.json(heatmap);
});

module.exports = {
  utilizationReport,
  maintenanceFrequencyReport,
  lifecycleOutlookReport,
  departmentAllocationReport,
  bookingHeatmapReport,
};
