const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { asyncHandler } = require('../middleware/errorHandler');
const { logActivity } = require('../utils/events');

// @route POST /api/auth/signup
// Public signup ALWAYS creates a plain Employee account. No role field is ever accepted here -
// that's the whole point: nobody can self-elevate. Admins promote people later from Org Setup.
const signup = asyncHandler(async (req, res) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ message: 'An account with this email already exists' });

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    department: department || null,
    role: 'Employee',
    status: 'Active',
  });

  await logActivity(user._id, 'Signed up', 'User', user._id, `${name} joined as Employee`);

  const token = generateToken(user._id);
  res.status(201).json({ token, user: user.toSafeObject() });
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  if (user.status !== 'Active') {
    return res.status(403).json({ message: 'This account has been deactivated. Contact your Admin.' });
  }

  const token = generateToken(user._id);
  await logActivity(user._id, 'Logged in', 'User', user._id);
  res.json({ token, user: user.toSafeObject() });
});

// @route GET /api/auth/me  (session validation)
const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

// @route POST /api/auth/forgot-password
// Hackathon-scope: returns the reset token directly instead of emailing it, so the flow
// is fully demoable without an SMTP provider. Swap this out for a real mailer in production.
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user) return res.status(200).json({ message: 'If that email exists, a reset link was sent' });

  const rawToken = crypto.randomBytes(20).toString('hex');
  user.resetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.resetTokenExpires = Date.now() + 1000 * 60 * 30; // 30 minutes
  await user.save();

  res.json({
    message: 'Reset token generated (demo mode - normally emailed)',
    resetToken: rawToken,
  });
});

// @route POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetToken: hashed,
    resetTokenExpires: { $gt: Date.now() },
  }).select('+resetToken +resetTokenExpires');

  if (!user) return res.status(400).json({ message: 'Reset token is invalid or expired' });

  user.password = newPassword;
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  await user.save();

  res.json({ message: 'Password updated - you can log in now' });
});

module.exports = { signup, login, me, forgotPassword, resetPassword };
