const Order = require('../models/Order');
const Step = require('../models/Step');
const { createAndAssignSteps } = require('../services/assignSteps');

// POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const { clientName, itemDescription, deadline } = req.body;

    // ---------- validation ----------
    if (!clientName || !itemDescription || !deadline) {
      return res.status(400).json({
        message: 'clientName, itemDescription, deadline required',
      });
    }

    const trimmedClient = String(clientName).trim();
    const trimmedItem = String(itemDescription).trim();
    const due = new Date(deadline);

    if (!trimmedClient || !trimmedItem) {
      return res.status(400).json({
        message: 'clientName and itemDescription cannot be empty',
      });
    }

    if (Number.isNaN(due.getTime())) {
      return res.status(400).json({
        message: 'deadline must be a valid date',
      });
    }

    if (!req.auth?.studioId || !req.user?._id) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    // ---------- create order ----------
    const order = await Order.create({
      studio: req.auth.studioId,
      clientName: trimmedClient,
      itemDescription: trimmedItem,
      deadline: due,
      createdBy: req.user._id,
      status: 'in_progress',
    });

    // ---------- AI / rule assignment ----------
    let steps = [];
    try {
      steps = await createAndAssignSteps(order);
    } catch (assignErr) {
      console.error('Assignment failed for order', order._id, assignErr);

      // Order exists, but assignment failed — keep order, return partial success
      return res.status(201).json({
        message:
          'Order created, but steps could not be assigned automatically. You can retry assignment.',
        order: {
          id: order._id,
          clientName: order.clientName,
          itemDescription: order.itemDescription,
          deadline: order.deadline,
          status: order.status,
          createdAt: order.createdAt,
        },
        steps: [],
        assignmentError: assignErr.message || 'Assignment failed',
      });
    }

    // ---------- success ----------
    return res.status(201).json({
      message: 'Order created and steps assigned',
      order: {
        id: order._id,
        clientName: order.clientName,
        itemDescription: order.itemDescription,
        deadline: order.deadline,
        status: order.status,
        createdAt: order.createdAt,
      },
      steps: (steps || []).map((s) => ({
        id: s._id,
        name: s.name,
        sequence: s.sequence,
        assignedTo: s.assignedTo,
        status: s.status,
        startedAt: s.startedAt,
      })),
    });
  } catch (err) {
    console.error('createOrder error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/orders
exports.listOrders = async (req, res) => {
  try {
    if (!req.auth?.studioId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const orders = await Order.find({ studio: req.auth.studioId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      orders: orders.map((o) => ({
        id: o._id,
        clientName: o.clientName,
        itemDescription: o.itemDescription,
        deadline: o.deadline,
        status: o.status,
        createdAt: o.createdAt,
      })),
    });
  } catch (err) {
    console.error('listOrders error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/orders/:id
exports.getOrder = async (req, res) => {
  try {
    if (!req.auth?.studioId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      studio: req.auth.studioId,
    }).lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const steps = await Step.find({ order: order._id })
      .populate('assignedTo', 'name skills')
      .sort({ sequence: 1 })
      .lean();

    return res.json({
      order: {
        id: order._id,
        clientName: order.clientName,
        itemDescription: order.itemDescription,
        deadline: order.deadline,
        status: order.status,
        createdAt: order.createdAt,
      },
      steps: steps.map((s) => ({
        id: s._id,
        name: s.name,
        sequence: s.sequence,
        status: s.status,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        assignedTo: s.assignedTo
          ? {
              id: s.assignedTo._id,
              name: s.assignedTo.name,
              skills: s.assignedTo.skills,
            }
          : null,
      })),
    });
  } catch (err) {
    console.error('getOrder error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};