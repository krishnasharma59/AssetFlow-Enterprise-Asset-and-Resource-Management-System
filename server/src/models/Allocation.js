const mongoose = require('mongoose');
module.exports = mongoose.model('Allocation', new mongoose.Schema({
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
  allocatedToUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  allocatedToDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  allocatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, allocationDate: { type: Date, default: Date.now },
  expectedReturnDate: { type: Date, default: null }, actualReturnDate: { type: Date, default: null },
  conditionOnReturn: { type: String, default: '' }, returnNotes: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Returned', 'Transferred'], default: 'Active', index: true },
}, { timestamps: true }));
