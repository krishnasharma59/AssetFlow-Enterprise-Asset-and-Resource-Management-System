const Department = require('../models/Department');
const { asyncHandler } = require('../middleware/errorHandler');
const { logActivity } = require('../utils/events');

const listDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find()
    .populate('head', 'name email')
    .populate('parentDepartment', 'name')
    .sort({ name: 1 });
  res.json(departments);
});

const createDepartment = asyncHandler(async (req, res) => {
  const { name, head, parentDepartment, status } = req.body;
  if (!name) return res.status(400).json({ message: 'Department name is required' });

  const dept = await Department.create({
    name,
    head: head || null,
    parentDepartment: parentDepartment || null,
    status: status || 'Active',
  });

  await logActivity(req.user._id, 'Created department', 'Department', dept._id, name);
  res.status(201).json(dept);
});

const updateDepartment = asyncHandler(async (req, res) => {
  const { name, head, parentDepartment, status } = req.body;
  const dept = await Department.findById(req.params.id);
  if (!dept) return res.status(404).json({ message: 'Department not found' });

  if (name !== undefined) dept.name = name;
  if (head !== undefined) dept.head = head || null;
  if (parentDepartment !== undefined) dept.parentDepartment = parentDepartment || null;
  if (status !== undefined) dept.status = status;
  await dept.save();

  await logActivity(req.user._id, 'Updated department', 'Department', dept._id, dept.name);
  res.json(dept);
});

// "Deactivate" rather than hard delete, so historical references (assets/allocations) stay valid
const deactivateDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findById(req.params.id);
  if (!dept) return res.status(404).json({ message: 'Department not found' });
  dept.status = 'Inactive';
  await dept.save();
  await logActivity(req.user._id, 'Deactivated department', 'Department', dept._id, dept.name);
  res.json(dept);
});

module.exports = { listDepartments, createDepartment, updateDepartment, deactivateDepartment };
