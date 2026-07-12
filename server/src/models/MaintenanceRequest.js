const mongoose = require('mongoose');
module.exports = mongoose.model('MaintenanceRequest', new mongoose.Schema({
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true }, raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issueDescription: { type: String, required: true, trim: true, minlength: [10, 'Issue description must contain at least 10 characters'], maxlength: [2000, 'Issue description cannot exceed 2000 characters'] }, priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' }, photoUrl: { type: String, default: '', trim: true, maxlength: 2048 },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Technician Assigned', 'In Progress', 'Resolved'], default: 'Pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, rejectionReason: { type: String, default: '', trim: true, maxlength: 1000 }, technicianName: { type: String, default: '', trim: true, maxlength: 100 },
  resolutionNotes: { type: String, default: '', trim: true, maxlength: 2000 }, resolvedAt: Date,
}, { timestamps: true }));
