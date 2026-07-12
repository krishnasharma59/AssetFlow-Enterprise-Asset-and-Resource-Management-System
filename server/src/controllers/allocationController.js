const Asset = require('../models/Asset');
const Allocation = require('../models/Allocation');
const TransferRequest = require('../models/TransferRequest');
const { asyncHandler } = require('../middleware/errorHandler');
const { notify, logActivity } = require('../utils/events');

// @route POST /api/allocations
// Conflict rule: an asset that is already Allocated cannot be allocated again.
// The caller is told who currently holds it and pointed at the transfer-request flow instead.
const allocateAsset = asyncHandler(async (req, res) => {
  const { assetId, allocatedToUser, allocatedToDepartment, expectedReturnDate } = req.body;

  if (!assetId || (!allocatedToUser && !allocatedToDepartment)) {
    return res.status(400).json({ message: 'assetId and either allocatedToUser or allocatedToDepartment are required' });
  }

  const asset = await Asset.findById(assetId).populate('currentHolderUser', 'name');
  if (!asset) return res.status(404).json({ message: 'Asset not found' });

  if (asset.status === 'Allocated') {
    return res.status(409).json({
      message: `This asset is currently held by ${asset.currentHolderUser?.name || 'another holder'}. Raise a transfer request instead.`,
      currentHolder: asset.currentHolderUser,
      code: 'ALREADY_ALLOCATED',
    });
  }
  if (!['Available'].includes(asset.status)) {
    return res.status(409).json({ message: `Asset is currently ${asset.status} and cannot be allocated right now.` });
  }

  const allocation = await Allocation.create({
    asset: asset._id,
    allocatedToUser: allocatedToUser || null,
    allocatedToDepartment: allocatedToDepartment || null,
    allocatedBy: req.user._id,
    expectedReturnDate: expectedReturnDate || null,
    status: 'Active',
  });

  asset.status = 'Allocated';
  asset.currentHolderUser = allocatedToUser || null;
  asset.currentHolderDepartment = allocatedToDepartment || null;
  await asset.save();

  if (allocatedToUser) {
    await notify(allocatedToUser, 'Asset Assigned', `${asset.name} (${asset.assetTag}) has been allocated to you`, 'Asset', asset._id);
  }
  await logActivity(req.user._id, 'Allocated asset', 'Asset', asset._id, `${asset.assetTag} -> ${allocatedToUser || allocatedToDepartment}`);

  res.status(201).json(allocation);
});

// @route GET /api/allocations  (list active + historical, with optional filters)
const listAllocations = asyncHandler(async (req, res) => {
  const { status, asset, user, department, overdue } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (asset) filter.asset = asset;
  if (user) filter.allocatedToUser = user;
  if (department) filter.allocatedToDepartment = department;
  if (overdue === 'true') {
    filter.status = 'Active';
    filter.expectedReturnDate = { $lt: new Date() };
  }

  const allocations = await Allocation.find(filter)
    .populate('asset', 'assetTag name status')
    .populate('allocatedToUser', 'name email')
    .populate('allocatedToDepartment', 'name')
    .populate('allocatedBy', 'name')
    .sort({ createdAt: -1 });

  res.json(allocations);
});

// @route POST /api/allocations/:id/return
const returnAsset = asyncHandler(async (req, res) => {
  const { conditionOnReturn, returnNotes } = req.body;
  const allocation = await Allocation.findById(req.params.id).populate('asset');
  if (!allocation) return res.status(404).json({ message: 'Allocation not found' });
  if (allocation.status !== 'Active') {
    return res.status(409).json({ message: 'This allocation is not currently active' });
  }

  allocation.status = 'Returned';
  allocation.actualReturnDate = new Date();
  allocation.conditionOnReturn = conditionOnReturn || '';
  allocation.returnNotes = returnNotes || '';
  await allocation.save();

  const asset = allocation.asset;
  asset.status = 'Available';
  asset.currentHolderUser = null;
  asset.currentHolderDepartment = null;
  if (conditionOnReturn) asset.condition = conditionOnReturn;
  await asset.save();

  await logActivity(req.user._id, 'Returned asset', 'Asset', asset._id, asset.assetTag);
  res.json(allocation);
});

// ---------- Transfer workflow: Requested -> Approved -> Re-allocated (or Rejected) ----------

// @route POST /api/transfers
const requestTransfer = asyncHandler(async (req, res) => {
  const { assetId, toUser, toDepartment, reason, expectedReturnDate } = req.body;
  if (!assetId || (!toUser && !toDepartment)) {
    return res.status(400).json({ message: 'assetId and either toUser or toDepartment are required' });
  }

  const asset = await Asset.findById(assetId);
  if (!asset) return res.status(404).json({ message: 'Asset not found' });
  if (asset.status !== 'Allocated') {
    return res.status(409).json({ message: 'Only currently-allocated assets can be transferred' });
  }

  const transfer = await TransferRequest.create({
    asset: asset._id,
    fromUser: asset.currentHolderUser,
    fromDepartment: asset.currentHolderDepartment,
    toUser: toUser || null,
    toDepartment: toDepartment || null,
    requestedBy: req.user._id,
    reason: reason || '',
    expectedReturnDate: expectedReturnDate || null,
    status: 'Requested',
  });

  await logActivity(req.user._id, 'Requested transfer', 'Asset', asset._id, asset.assetTag);
  res.status(201).json(transfer);
});

const listTransfers = asyncHandler(async (req, res) => {
  const { status, asset } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (asset) filter.asset = asset;

  const transfers = await TransferRequest.find(filter)
    .populate('asset', 'assetTag name status')
    .populate('fromUser', 'name')
    .populate('fromDepartment', 'name')
    .populate('toUser', 'name')
    .populate('toDepartment', 'name')
    .populate('requestedBy', 'name')
    .sort({ createdAt: -1 });

  res.json(transfers);
});

// @route PATCH /api/transfers/:id/decision  { decision: 'Approved' | 'Rejected' }
// Approving closes out the old Allocation and opens a new one automatically - history updates itself.
const decideTransfer = asyncHandler(async (req, res) => {
  const { decision } = req.body;
  if (!['Approved', 'Rejected'].includes(decision)) {
    return res.status(400).json({ message: 'decision must be Approved or Rejected' });
  }

  const transfer = await TransferRequest.findById(req.params.id).populate('asset');
  if (!transfer) return res.status(404).json({ message: 'Transfer request not found' });
  if (transfer.status !== 'Requested') {
    return res.status(409).json({ message: 'This transfer request has already been decided' });
  }

  transfer.approvedBy = req.user._id;

  if (decision === 'Rejected') {
    transfer.status = 'Rejected';
    await transfer.save();
    await notify(transfer.requestedBy, 'Transfer Rejected', `Transfer request for ${transfer.asset.assetTag} was rejected`);
    return res.json(transfer);
  }

  // Approved: close the current allocation, open a new one, move the asset
  const asset = transfer.asset;
  await Allocation.findOneAndUpdate(
    { asset: asset._id, status: 'Active' },
    { status: 'Transferred', actualReturnDate: new Date() }
  );

  const newAllocation = await Allocation.create({
    asset: asset._id,
    allocatedToUser: transfer.toUser || null,
    allocatedToDepartment: transfer.toDepartment || null,
    allocatedBy: req.user._id,
    expectedReturnDate: transfer.expectedReturnDate || null,
    status: 'Active',
  });

  asset.currentHolderUser = transfer.toUser || null;
  asset.currentHolderDepartment = transfer.toDepartment || null;
  asset.status = 'Allocated';
  await asset.save();

  transfer.status = 'Completed';
  await transfer.save();

  if (transfer.toUser) {
    await notify(transfer.toUser, 'Transfer Approved', `${asset.name} (${asset.assetTag}) has been transferred to you`);
  }
  await notify(transfer.requestedBy, 'Transfer Approved', `Your transfer request for ${asset.assetTag} was approved`);
  await logActivity(req.user._id, 'Approved transfer', 'Asset', asset._id, asset.assetTag);

  res.json({ transfer, newAllocation });
});

module.exports = {
  allocateAsset,
  listAllocations,
  returnAsset,
  requestTransfer,
  listTransfers,
  decideTransfer,
};
