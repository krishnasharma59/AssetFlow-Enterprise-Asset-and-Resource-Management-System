const mongoose = require('mongoose');
module.exports = mongoose.model('AssetCategory', new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  description: { type: String, default: '' },
  customFields: [{ label: String, type: { type: String, enum: ['text', 'number', 'date'], default: 'text' } }],
}, { timestamps: true }));
