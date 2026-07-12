const mongoose = require('mongoose');
module.exports = mongoose.model('ActivityLog', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, action: { type: String, required: true }, entityType: { type: String, default: '' },
  entityId: { type: mongoose.Schema.Types.ObjectId, default: null }, details: { type: String, default: '' },
}, { timestamps: true }));
