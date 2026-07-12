const mongoose = require('mongoose');
module.exports = mongoose.model('TransferRequest', new mongoose.Schema({
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, fromDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, toDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reason: { type: String, default: '' }, expectedReturnDate: Date,
  status: { type: String, enum: ['Requested', 'Approved', 'Rejected', 'Completed'], default: 'Requested' },
}, { timestamps: true }));
