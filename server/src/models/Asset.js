const mongoose = require('mongoose');
module.exports = mongoose.model('Asset', new mongoose.Schema({
  assetTag: { type: String, required: true, unique: true, index: true }, name: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'AssetCategory', required: true }, serialNumber: { type: String, default: '', index: true }, qrCode: { type: String, default: '', index: true },
  acquisitionDate: Date, acquisitionCost: { type: Number, default: 0 }, condition: { type: String, default: 'New' }, location: { type: String, default: '' },
  photoUrl: { type: String, default: '' }, documentUrl: { type: String, default: '' }, isBookable: { type: Boolean, default: false },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  status: { type: String, enum: ['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'], default: 'Available', index: true },
  currentHolderUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, currentHolderDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  customFieldValues: { type: mongoose.Schema.Types.Mixed, default: {} }, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true }));
