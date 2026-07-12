const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: [2, 'Name must contain at least 2 characters'], maxlength: [50, 'Name cannot exceed 50 characters'] },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: [100, 'Email cannot exceed 100 characters'], match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'] },
  password: { type: String, required: true, minlength: [8, 'Password must contain at least 8 characters'], maxlength: [20, 'Password cannot exceed 20 characters'], select: false },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  role: { type: String, enum: ['Admin', 'Employee', 'DepartmentHead', 'AssetManager'], default: 'Employee' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  resetToken: { type: String, select: false },
  resetTokenExpires: { type: Date, select: false },
}, { timestamps: true });
userSchema.pre('save', async function hashPassword(next) { if (!this.isModified('password')) return next(); this.password = await bcrypt.hash(this.password, 12); next(); });
userSchema.methods.comparePassword = function comparePassword(candidate) { return bcrypt.compare(candidate, this.password); };
userSchema.methods.toSafeObject = function toSafeObject() { const object = this.toObject(); delete object.password; delete object.resetToken; delete object.resetTokenExpires; return object; };
module.exports = mongoose.model('User', userSchema);
