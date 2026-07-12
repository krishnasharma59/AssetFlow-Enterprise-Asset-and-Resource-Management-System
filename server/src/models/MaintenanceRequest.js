const mongoose = require('mongoose');
module.exports = mongoose.model('MaintenanceRequest', new mongoose.Schema({
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true }, raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issueDescription: { type: String, required: true }, priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' }, photoUrl: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Technician Assigned', 'In Progress', 'Resolved'], default: 'Pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, rejectionReason: { type: String, default: '' }, technicianName: { type: String, default: '' },
  resolutionNotes: { type: String, default: '' }, resolvedAt: Date,
}, { timestamps: true }));
