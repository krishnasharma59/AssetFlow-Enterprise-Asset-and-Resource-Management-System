const Asset = require('../models/Asset');
const Allocation = require('../models/Allocation');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const generateAssetTag = require('../utils/generateAssetTag');
const { asyncHandler } = require('../middleware/errorHandler');
const { logActivity } = require('../utils/events');

// @route POST /api/assets  (Asset Manager / Admin)
const registerAsset = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    serialNumber,
    acquisitionDate,
    acquisitionCost,
    condition,
    location,
    photoUrl,
    documentUrl,
    isBookable,
    department,
    customFieldValues,
  } = req.body;

  if (!name || !category) {
    return res.status(400).json({ message: 'Asset name and category are required' });
  }

  const assetTag = await generateAssetTag();

  const asset = await Asset.create({
    assetTag,
    name,
    category,
    serialNumber: serialNumber || '',
    qrCode: assetTag,
    acquisitionDate: acquisitionDate || null,
    acquisitionCost: acquisitionCost || 0,
    condition: condition || 'New',
    location: location || '',
    photoUrl: photoUrl || '',
    documentUrl: documentUrl || '',
    isBookable: !!isBookable,
    department: department || null,
    status: 'Available',
    customFieldValues: customFieldValues || {},
    createdBy: req.user._id,
  });

  await logActivity(req.user._id, 'Registered asset', 'Asset', asset._id, `${asset.assetTag} - ${asset.name}`);
  res.status(201).json(asset);
});

// @route GET /api/assets  (search/filter by tag, serial, qr, category, status, department, location)
const listAssets = asyncHandler(async (req, res) => {
  const { q, category, status, department, location, bookableOnly } = req.query;
  const filter = {};

  if (q) {
    filter.$or = [
      { assetTag: { $regex: q, $options: 'i' } },
      { serialNumber: { $regex: q, $options: 'i' } },
      { qrCode: { $regex: q, $options: 'i' } },
      { name: { $regex: q, $options: 'i' } },
    ];
  }
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (department) filter.department = department;
  if (location) filter.location = { $regex: location, $options: 'i' };
  if (bookableOnly === 'true') filter.isBookable = true;

  const assets = await Asset.find(filter)
    .populate('category', 'name')
    .populate('department', 'name')
    .populate('currentHolderUser', 'name email')
    .populate('currentHolderDepartment', 'name')
    .sort({ createdAt: -1 });

  res.json(assets);
});

const getAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id)
    .populate('category')
    .populate('department', 'name')
    .populate('currentHolderUser', 'name email')
    .populate('currentHolderDepartment', 'name');
  if (!asset) return res.status(404).json({ message: 'Asset not found' });
  res.json(asset);
});

// @route GET /api/assets/:id/history  (allocation history + maintenance history)
const getAssetHistory = asyncHandler(async (req, res) => {
  const allocations = await Allocation.find({ asset: req.params.id })
    .populate('allocatedToUser', 'name email')
    .populate('allocatedToDepartment', 'name')
    .populate('allocatedBy', 'name')
    .sort({ allocationDate: -1 });

  const maintenance = await MaintenanceRequest.find({ asset: req.params.id })
    .populate('raisedBy', 'name')
    .populate('approvedBy', 'name')
    .sort({ createdAt: -1 });

  res.json({ allocations, maintenance });
});

const updateAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) return res.status(404).json({ message: 'Asset not found' });

  const editable = [
    'name', 'category', 'serialNumber', 'acquisitionDate', 'acquisitionCost',
    'condition', 'location', 'photoUrl', 'documentUrl', 'isBookable', 'department',
    'customFieldValues',
  ];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) asset[field] = req.body[field];
  });
  await asset.save();

  await logActivity(req.user._id, 'Updated asset', 'Asset', asset._id, asset.assetTag);
  res.json(asset);
});

// Manual lifecycle transitions not covered by allocation/maintenance/audit flows
// e.g. Available -> Retired, Available -> Disposed
const changeAssetStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['Available', 'Retired', 'Disposed', 'Lost'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: `Manual status change only supports: ${allowed.join(', ')}` });
  }
  const asset = await Asset.findById(req.params.id);
  if (!asset) return res.status(404).json({ message: 'Asset not found' });
  if (asset.status === 'Allocated' || asset.status === 'Reserved' || asset.status === 'Under Maintenance') {
    return res.status(409).json({
      message: `Asset is currently ${asset.status}. Resolve that first before changing its status.`,
    });
  }

  asset.status = status;
  await asset.save();
  await logActivity(req.user._id, `Marked asset ${status}`, 'Asset', asset._id, asset.assetTag);
  res.json(asset);
});

module.exports = {
  registerAsset,
  listAssets,
  getAsset,
  getAssetHistory,
  updateAsset,
  changeAssetStatus,
};
