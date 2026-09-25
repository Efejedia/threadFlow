const Order = require('../models/Order');
const Staff = require('../models/Staff');
const Step = require('../models/Step');
const Studio = require('../models/Studio');
const { assignOrderSteps } = require('../services/assignmentAgent');
const { buildOpsBrief } = require('../services/opsBrief');

// Resolve studio id from your auth shape
function getStudioId(req) {
  return (
    req.auth?.studioId ||
    req.user?.studioId ||
    req.user?.studio ||
    null
  );
}

/**
 * GET /api/owner/ops-brief
 * Owner JWT required. Studio-scoped.
 */
const getOpsBrief = async (req, res) => {
  try {
    const studioId = getStudioId(req);

    if (!studioId) {
      return res.status(400).json({ message: 'Studio not found on user' });
    }

    const [studio, orders, staff, steps] = await Promise.all([
      Studio.findById(studioId).lean(),
      Order.find({ studio: studioId }).lean(),
      Staff.find({ studio: studioId, isActive: { $ne: false } }).lean(),
      Step.find({ studio: studioId }).lean(),
    ]);

    // Open task counts by assignedTo
    const openCounts = {};
    for (const s of steps) {
      if (!['assigned', 'in_progress', 'pending'].includes(s.status)) continue;
      if (!s.assignedTo) continue;
      const key = String(s.assignedTo);
      openCounts[key] = (openCounts[key] || 0) + 1;
    }

    const staffWithLoad = staff.map((p) => ({
      ...p,
      openTasks: openCounts[String(p._id)] || 0,
    }));

    // Normalize fields for buildOpsBrief
    const brief = buildOpsBrief({
      studioName: studio?.name || 'Studio',
      orders: orders.map((o) => ({
        ...o,
        dueDate: o.deadline,
        status: o.status,
        clientName: o.clientName,
        itemDescription: o.itemDescription,
      })),
      steps: steps.map((s) => ({
        ...s,
        name: s.name,
        status: s.status,
        assigneeId: s.assignedTo,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
      })),
      staff: staffWithLoad,
    });

    return res.json(brief);
  } catch (error) {
    console.error('ops-brief error:', error);
    return res.status(500).json({
      message: error.message || 'Failed to build ops brief',
    });
  }
};

/**
 * GET /api/owner/agent/config
 * Returns Swift Agent widget credentials (owner only)
 */
const getAgentConfig = async (req, res) => {
  try {
    const companyId = process.env.SWIFT_AGENT_COMPANY_ID;
    const apiKey = process.env.SWIFT_AGENT_API_KEY;
    const widgetSrc =
      process.env.SWIFT_AGENT_WIDGET_SRC ||
      'https://cdn.swiftagents.org/widget.js';

    if (!companyId || !apiKey) {
      return res.status(503).json({
        message: 'Swift Agent is not configured on the server',
      });
    }

    return res.json({
      companyId,
      apiKey,
      widgetSrc,
      mode: 'widget',
    });
  } catch (error) {
    console.error('getAgentConfig error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/orders/:id/assign
 * Re-run assignment agent for an order (owner only).
 */
const reassignOrder = async (req, res) => {
  try {
    const studioId = getStudioId(req);
    const { id } = req.params;

    if (!studioId) {
      return res.status(400).json({ message: 'Studio not found on user' });
    }

    const order = await Order.findOne({ _id: id, studio: studioId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const staff = await Staff.find({
      studio: studioId,
      isActive: { $ne: false },
    }).lean();

    // Count open tasks per staff
    const openSteps = await Step.find({
      studio: studioId,
      status: { $in: ['pending', 'assigned', 'in_progress'] },
    }).lean();

    const openCounts = {};
    for (const s of openSteps) {
      if (!s.assignedTo) continue;
      const key = String(s.assignedTo);
      openCounts[key] = (openCounts[key] || 0) + 1;
    }

    const staffWithLoad = staff.map((p) => ({
      ...p,
      openTasks: openCounts[String(p._id)] || 0,
    }));

    const { steps } = assignOrderSteps({
      order: {
        itemDescription: order.itemDescription,
      },
      staff: staffWithLoad,
    });

    // Remove steps that are not done yet, then recreate
    await Step.deleteMany({
      order: order._id,
      studio: studioId,
      status: { $in: ['pending', 'assigned'] },
    });

    const created = await Step.insertMany(
      steps.map((s) => ({
        studio: studioId,
        order: order._id,
        name: s.name,
        skill: s.skill,
        sequence: s.orderIndex,
        assignedTo: s.assigneeId,
        status: s.assigneeId ? 'assigned' : 'pending',
        startedAt: s.assigneeId ? new Date() : null,
      }))
    );

    order.status = 'in_progress';
    await order.save();

    return res.json({
      message: 'Order assigned',
      orderId: order._id,
      steps: created.map((s) => ({
        id: s._id,
        name: s.name,
        sequence: s.sequence,
        assignedTo: s.assignedTo,
        status: s.status,
        startedAt: s.startedAt,
      })),
    });
  } catch (error) {
    console.error('reassign error:', error);
    return res.status(500).json({
      message: error.message || 'Assignment failed',
    });
  }
};

module.exports = {
  getOpsBrief,
  getAgentConfig,
  reassignOrder,
};