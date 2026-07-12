const Asset = require('../models/Asset');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const { asyncHandler } = require('../middleware/errorHandler');
const { notify, logActivity } = require('../utils/events');

// @route POST /api/maintenance  (holder raises a request)
const raiseRequest = asyncHandler(async (req, res) => {
  const { assetId, issueDescription, priority, photoUrl } = req.body;
  if (!assetId || !issueDescription) {
    return res.status(400).json({ message: 'assetId and issueDescription are required' });
  }
  const asset = await Asset.findById(assetId);
  if (!asset) return res.status(404).json({ message: 'Asset not found' });
  if (asset.status === 'Under Maintenance') {
    return res.status(409).json({ message: 'This asset already has maintenance in progress' });
  }

  const request = await MaintenanceRequest.create({
    asset: assetId,
    raisedBy: req.user._id,
    issueDescription,
    priority: priority || 'Medium',
    photoUrl: photoUrl || '',
    status: 'Pending',
  });

  await logActivity(req.user._id, 'Raised maintenance request', 'Asset', asset._id, asset.assetTag);
  res.status(201).json(request);
});

const listRequests = asyncHandler(async (req, res) => {
  const { status, asset, priority } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (asset) filter.asset = asset;
  if (priority) filter.priority = priority;

  const requests = await MaintenanceRequest.find(filter)
    .populate('asset', 'assetTag name status')
    .populate('raisedBy', 'name')
    .populate('approvedBy', 'name')
    .sort({ createdAt: -1 });

  res.json(requests);
});

// @route PATCH /api/maintenance/:id/decision  { decision: 'Approved'|'Rejected', rejectionReason? }
// Approving is the moment the asset flips to "Under Maintenance" - work cannot start before this.
const decideRequest = asyncHandler(async (req, res) => {
  const { decision, rejectionReason } = req.body;
  if (!['Approved', 'Rejected'].includes(decision)) {
    return res.status(400).json({ message: 'decision must be Approved or Rejected' });
  }

  const request = await MaintenanceRequest.findById(req.params.id).populate('asset');
  if (!request) return res.status(404).json({ message: 'Maintenance request not found' });
  if (request.status !== 'Pending') {
    return res.status(409).json({ message: 'This request has already been decided' });
  }

  request.approvedBy = req.user._id;
  request.status = decision;
  if (decision === 'Rejected') request.rejectionReason = rejectionReason || '';
  await request.save();

  if (decision === 'Approved') {
    request.asset.status = 'Under Maintenance';
    await request.asset.save();
    await notify(request.raisedBy, 'Maintenance Approved', `Maintenance for ${request.asset.assetTag} was approved`);
  } else {
    await notify(request.raisedBy, 'Maintenance Rejected', `Maintenance for ${request.asset.assetTag} was rejected: ${rejectionReason || 'no reason given'}`);
  }

  await logActivity(req.user._id, `${decision} maintenance request`, 'Asset', request.asset._id, request.asset.assetTag);
  res.json(request);
});

// @route PATCH /api/maintenance/:id/assign-technician
const assignTechnician = asyncHandler(async (req, res) => {
  const { technicianName } = req.body;
  const request = await MaintenanceRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Maintenance request not found' });
  if (request.status !== 'Approved') {
    return res.status(409).json({ message: 'A technician can only be assigned after approval' });
  }
  request.technicianName = technicianName || 'Unassigned';
  request.status = 'Technician Assigned';
  await request.save();
  await logActivity(req.user._id, 'Assigned technician', 'MaintenanceRequest', request._id, technicianName);
  res.json(request);
});

// @route PATCH /api/maintenance/:id/start
const startProgress = asyncHandler(async (req, res) => {
  const request = await MaintenanceRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Maintenance request not found' });
  if (request.status !== 'Technician Assigned') {
    return res.status(409).json({ message: 'Assign a technician before starting work' });
  }
  request.status = 'In Progress';
  await request.save();
  res.json(request);
});

// @route PATCH /api/maintenance/:id/resolve
// Resolving is the moment the asset flips back to Available.
const resolveRequest = asyncHandler(async (req, res) => {
  const { resolutionNotes } = req.body;
  const request = await MaintenanceRequest.findById(req.params.id).populate('asset');
  if (!request) return res.status(404).json({ message: 'Maintenance request not found' });
  if (!['In Progress', 'Technician Assigned'].includes(request.status)) {
    return res.status(409).json({ message: 'Request must be in progress before it can be resolved' });
  }

  request.status = 'Resolved';
  request.resolutionNotes = resolutionNotes || '';
  request.resolvedAt = new Date();
  await request.save();

  request.asset.status = 'Available';
  await request.asset.save();

  await notify(request.raisedBy, 'Maintenance Approved', `${request.asset.assetTag} has been repaired and is available again`);
  await logActivity(req.user._id, 'Resolved maintenance request', 'Asset', request.asset._id, request.asset.assetTag);

  res.json(request);
});

module.exports = { raiseRequest, listRequests, decideRequest, assignTechnician, startProgress, resolveRequest };
