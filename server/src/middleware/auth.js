const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the bearer token and attaches the requesting user to req.user
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated - missing token' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'This account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session invalid or expired, please log in again' });
  }
};

// Usage: authorize('Admin', 'AssetManager')
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: `This action requires one of: ${roles.join(', ')}` });
  }
  next();
};

module.exports = { protect, authorize };
