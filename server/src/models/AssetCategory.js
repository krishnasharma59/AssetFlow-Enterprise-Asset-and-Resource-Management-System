const mongoose = require('mongoose');
module.exports = mongoose.model('AssetCategory', new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true, minlength: [2, 'Category name must contain at least 2 characters'], maxlength: [80, 'Category name cannot exceed 80 characters'] },
  description: { type: String, default: '', trim: true, maxlength: [500, 'Description cannot exceed 500 characters'] },
  customFields: [{ label: { type: String, trim: true, maxlength: 80 }, type: { type: String, enum: ['text', 'number', 'date'], default: 'text' } }],
}, { timestamps: true }));
