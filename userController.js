const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { notify, logActivity } = require('../utils/events');

// @route GET /api/users  (Employee Directory - Screen 3 Tab C)
const listUsers = asyncHandler(async (req, res) => {
  const { department, role, status, search } = req.query;
  const filter = {};
  if (department) filter.department = department;
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];

  const users = await User.find(filter).populate('department', 'name').sort({ createdAt: -1 });
  res.json(users);
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('department', 'name');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// @route PATCH /api/users/:id  (Admin edits directory entry: department/status/name)
const updateUser = asyncHandler(async (req, res) => {
  const { name, department, status } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (name) user.name = name;
  if (department !== undefined) user.department = department || null;
  if (status) user.status = status;
  await user.save();

  await logActivity(req.user._id, 'Updated employee record', 'User', user._id, user.name);
  res.json(user.toSafeObject());
});

// @route PATCH /api/users/:id/role
// This is THE ONLY place any role is ever assigned. Admin-only, and Admin cannot be self-assigned
// (there's no route to make yourself Admin - the very first Admin comes from the seed script).
const changeRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const allowedTargets = ['Employee', 'DepartmentHead', 'AssetManager'];
  if (!allowedTargets.includes(role)) {
    return res.status(400).json({ message: `Role must be one of: ${allowedTargets.join(', ')}` });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const previousRole = user.role;
  user.role = role;
  await user.save();

  await notify(user._id, 'Role Updated', `Your role was changed from ${previousRole} to ${role} by an Admin`);
  await logActivity(req.user._id, `Promoted ${user.name} to ${role}`, 'User', user._id);

  res.json(user.toSafeObject());
});

module.exports = { listUsers, getUser, updateUser, changeRole };
