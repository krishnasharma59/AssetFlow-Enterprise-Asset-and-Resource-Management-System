const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

async function notify(userId, type, message, relatedEntityType = '', relatedEntityId = null) {
  if (!userId) return null;
  try {
    return await Notification.create({
      user: userId,
      type,
      message,
      relatedEntityType,
      relatedEntityId,
    });
  } catch (err) {
    console.error('notify() failed:', err.message);
    return null;
  }
}

async function logActivity(userId, action, entityType = '', entityId = null, details = '') {
  try {
    return await ActivityLog.create({ user: userId, action, entityType, entityId, details });
  } catch (err) {
    console.error('logActivity() failed:', err.message);
    return null;
  }
}

module.exports = { notify, logActivity };
