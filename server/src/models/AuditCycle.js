const mongoose = require('mongoose');
module.exports = mongoose.model('AuditCycle', new mongoose.Schema({
  name: { type: String, required: true }, scopeDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null }, scopeLocation: { type: String, default: '' },
  startDate: { type: Date, required: true }, endDate: { type: Date, required: true }, auditors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, status: { type: String, enum: ['Planned', 'In Progress', 'Closed'], default: 'Planned' }, closedAt: Date,
}, { timestamps: true }));
