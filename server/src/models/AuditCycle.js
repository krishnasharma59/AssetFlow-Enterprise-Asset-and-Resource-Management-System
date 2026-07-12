const mongoose = require('mongoose');
module.exports = mongoose.model('AuditCycle', new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: [3, 'Audit cycle name must contain at least 3 characters'], maxlength: [120, 'Audit cycle name cannot exceed 120 characters'] }, scopeDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null }, scopeLocation: { type: String, default: '', trim: true, maxlength: 120 },
  startDate: { type: Date, required: true }, endDate: { type: Date, required: true }, auditors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, status: { type: String, enum: ['Planned', 'In Progress', 'Closed'], default: 'Planned' }, closedAt: Date,
}, { timestamps: true }));
