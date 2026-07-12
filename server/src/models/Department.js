const mongoose = require('mongoose');
module.exports = mongoose.model('Department', new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  head: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  parentDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true }));
