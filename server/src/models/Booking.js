const mongoose = require('mongoose');
module.exports = mongoose.model('Booking', new mongoose.Schema({
  resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, onBehalfOfDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  purpose: { type: String, default: '', trim: true, maxlength: [300, 'Booking purpose cannot exceed 300 characters'] }, startTime: { type: Date, required: true, index: true }, endTime: { type: Date, required: true },
  status: { type: String, enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'], default: 'Upcoming', index: true }, reminderSent: { type: Boolean, default: false },
}, { timestamps: true }));
