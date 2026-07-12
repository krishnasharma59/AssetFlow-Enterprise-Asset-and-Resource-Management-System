const Asset = require('../models/Asset');
const AuditCycle = require('../models/AuditCycle');
const AuditItem = require('../models/AuditItem');
const { asyncHandler } = require('../middleware/errorHandler');
const { notify, logActivity } = require('../utils/events');

// @route POST /api/audits
// Creating a cycle immediately snapshots every asset in scope into AuditItems (status Pending),
// so auditors have a fixed checklist to work through instead of a blank form.
const createAuditCycle = asyncHandler(async (req, res) => {
  const { name, scopeDepartment, scopeLocation, startDate, endDate, auditors } = req.body;
  if (!name || !startDate || !endDate) {
    return res.status(400).json({ message: 'name, startDate and endDate are required' });
  }

  const cycle = await AuditCycle.create({
    name,
    scopeDepartment: scopeDepartment || null,
    scopeLocation: scopeLocation || '',
    startDate,
    endDate,
    auditors: auditors || [],
    createdBy: req.user._id,
    status: 'Planned',
  });

  const assetFilter = { status: { $nin: ['Disposed'] } };
  if (scopeDepartment) assetFilter.department = scopeDepartment;
  if (scopeLocation) assetFilter.location = { $regex: scopeLocation, $options: 'i' };
  const assetsInScope = await Asset.find(assetFilter).select('_id');

  if (assetsInScope.length) {
    await AuditItem.insertMany(
      assetsInScope.map((a) => ({ auditCycle: cycle._id, asset: a._id, result: 'Pending' }))
    );
  }

  await Promise.all(
    (auditors || []).map((auditorId) =>
      notify(auditorId, 'Audit Assigned', `You've been assigned to audit cycle "${name}"`)
    )
  );
  await logActivity(req.user._id, 'Created audit cycle', 'AuditCycle', cycle._id, `${name} (${assetsInScope.length} assets in scope)`);

  res.status(201).json({ cycle, itemCount: assetsInScope.length });
});

const listAuditCycles = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const cycles = await AuditCycle.find(filter)
    .populate('scopeDepartment', 'name')
    .populate('auditors', 'name email')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });
  res.json(cycles);
});

const getAuditCycle = asyncHandler(async (req, res) => {
  const cycle = await AuditCycle.findById(req.params.id)
    .populate('scopeDepartment', 'name')
    .populate('auditors', 'name email');
  if (!cycle) return res.status(404).json({ message: 'Audit cycle not found' });

  const items = await AuditItem.find({ auditCycle: cycle._id })
    .populate('asset', 'assetTag name location status')
    .populate('verifiedBy', 'name')
    .sort({ createdAt: 1 });

  res.json({ cycle, items });
});

// @route PATCH /api/audits/:id/start
const startAuditCycle = asyncHandler(async (req, res) => {
  const cycle = await AuditCycle.findById(req.params.id);
  if (!cycle) return res.status(404).json({ message: 'Audit cycle not found' });
  if (cycle.status !== 'Planned') return res.status(409).json({ message: 'Only a Planned cycle can be started' });
  cycle.status = 'In Progress';
  await cycle.save();
  res.json(cycle);
});

// @route PATCH /api/audits/items/:itemId  (auditor marks Verified / Missing / Damaged)
const markAuditItem = asyncHandler(async (req, res) => {
  const { result, notes } = req.body;
  if (!['Verified', 'Missing', 'Damaged'].includes(result)) {
    return res.status(400).json({ message: 'result must be Verified, Missing or Damaged' });
  }

  const item = await AuditItem.findById(req.params.itemId).populate('asset');
  if (!item) return res.status(404).json({ message: 'Audit item not found' });

  const cycle = await AuditCycle.findById(item.auditCycle);
  if (cycle.status === 'Closed') return res.status(409).json({ message: 'This audit cycle is closed and locked' });

  item.result = result;
  item.notes = notes || '';
  item.verifiedBy = req.user._id;
  item.verifiedAt = new Date();
  await item.save();

  if (result !== 'Verified') {
    await logActivity(req.user._id, `Flagged asset as ${result} during audit`, 'Asset', item.asset._id, item.asset.assetTag);
  }

  res.json(item);
});

// @route GET /api/audits/:id/discrepancies  (auto-generated: anything not Verified)
const getDiscrepancies = asyncHandler(async (req, res) => {
  const items = await AuditItem.find({
    auditCycle: req.params.id,
    result: { $in: ['Missing', 'Damaged'] },
  })
    .populate('asset', 'assetTag name location status')
    .populate('verifiedBy', 'name');
  res.json(items);
});

// @route PATCH /api/audits/:id/close
// Locks the cycle and pushes confirmed discrepancies into asset lifecycle status.
const closeAuditCycle = asyncHandler(async (req, res) => {
  const cycle = await AuditCycle.findById(req.params.id);
  if (!cycle) return res.status(404).json({ message: 'Audit cycle not found' });
  if (cycle.status === 'Closed') return res.status(409).json({ message: 'Cycle is already closed' });

  const items = await AuditItem.find({ auditCycle: cycle._id }).populate('asset');

  for (const item of items) {
    if (item.result === 'Missing') {
      item.asset.status = 'Lost';
      await item.asset.save();
    } else if (item.result === 'Damaged') {
      item.asset.condition = 'Damaged';
      await item.asset.save();
    }
  }

  cycle.status = 'Closed';
  cycle.closedAt = new Date();
  await cycle.save();

  const discrepancyCount = items.filter((i) => i.result !== 'Verified').length;
  if (discrepancyCount > 0) {
    await Promise.all(
      cycle.auditors.map((auditorId) =>
        notify(auditorId, 'Audit Discrepancy Flagged', `Audit "${cycle.name}" closed with ${discrepancyCount} discrepancy(ies)`)
      )
    );
  }
  await logActivity(req.user._id, 'Closed audit cycle', 'AuditCycle', cycle._id, `${discrepancyCount} discrepancies`);

  res.json({ cycle, discrepancyCount });
});

module.exports = {
  createAuditCycle,
  listAuditCycles,
  getAuditCycle,
  startAuditCycle,
  markAuditItem,
  getDiscrepancies,
  closeAuditCycle,
};
