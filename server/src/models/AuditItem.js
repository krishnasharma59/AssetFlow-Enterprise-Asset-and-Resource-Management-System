const mongoose = require('mongoose');
module.exports = mongoose.model('AuditItem', new mongoose.Schema({
  auditCycle: { type: mongoose.Schema.Types.ObjectId, ref: 'AuditCycle', required: true, index: true }, asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  result: { type: String, enum: ['Pending', 'Verified', 'Missing', 'Damaged'], default: 'Pending' }, notes: { type: String, default: '' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, verifiedAt: Date,
}, { timestamps: true }));
