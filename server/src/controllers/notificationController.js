const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { asyncHandler } = require('../middleware/errorHandler');

// @route GET /api/notifications  (current user's own notifications)
const listMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ notifications, unreadCount });
});

// @route PATCH /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  res.json(notification);
});

// @route PATCH /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ message: 'All notifications marked read' });
});

// @route GET /api/activity-logs  (Admin/Manager view - full trail of who did what, when)
const listActivityLogs = asyncHandler(async (req, res) => {
  const { user, entityType, from, to } = req.query;
  const filter = {};
  if (user) filter.user = user;
  if (entityType) filter.entityType = entityType;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const logs = await ActivityLog.find(filter)
    .populate('user', 'name email role')
    .sort({ createdAt: -1 })
    .limit(500);
  res.json(logs);
});

module.exports = { listMyNotifications, markAsRead, markAllAsRead, listActivityLogs };
