const mongoose = require('mongoose');
module.exports = mongoose.model('Asset', new mongoose.Schema({
  assetTag: { type: String, required: true, unique: true, index: true, maxlength: 30 }, name: { type: String, required: true, trim: true, minlength: [2, 'Asset name must contain at least 2 characters'], maxlength: [120, 'Asset name cannot exceed 120 characters'] },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'AssetCategory', required: true }, serialNumber: { type: String, default: '', trim: true, index: true, maxlength: 100 }, qrCode: { type: String, default: '', trim: true, index: true, maxlength: 200 },
  acquisitionDate: { type: Date, validate: { validator: (value) => !value || value <= new Date(), message: 'Acquisition date cannot be in the future' } }, acquisitionCost: { type: Number, default: 0, min: [0, 'Acquisition cost cannot be negative'], max: [1000000000, 'Acquisition cost is too large'] }, condition: { type: String, default: 'New', trim: true, maxlength: 80 }, location: { type: String, default: '', trim: true, maxlength: 120 },
  photoUrl: { type: String, default: '', trim: true, maxlength: 2048 }, documentUrl: { type: String, default: '', trim: true, maxlength: 2048 }, isBookable: { type: Boolean, default: false },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  status: { type: String, enum: ['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'], default: 'Available', index: true },
  currentHolderUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, currentHolderDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  customFieldValues: { type: mongoose.Schema.Types.Mixed, default: {} }, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true }));
