const AssetCategory = require('../models/AssetCategory');
const { asyncHandler } = require('../middleware/errorHandler');
const { logActivity } = require('../utils/events');

const listCategories = asyncHandler(async (req, res) => {
  const categories = await AssetCategory.find().sort({ name: 1 });
  res.json(categories);
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, customFields } = req.body;
  if (!name) return res.status(400).json({ message: 'Category name is required' });

  const category = await AssetCategory.create({
    name,
    description: description || '',
    customFields: customFields || [],
  });

  await logActivity(req.user._id, 'Created asset category', 'AssetCategory', category._id, name);
  res.status(201).json(category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, customFields } = req.body;
  const category = await AssetCategory.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });

  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;
  if (customFields !== undefined) category.customFields = customFields;
  await category.save();

  await logActivity(req.user._id, 'Updated asset category', 'AssetCategory', category._id, category.name);
  res.json(category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await AssetCategory.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  await category.deleteOne();
  await logActivity(req.user._id, 'Deleted asset category', 'AssetCategory', category._id, category.name);
  res.json({ message: 'Category deleted' });
});

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
