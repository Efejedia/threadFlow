const Order = require('../models/Order');
const Step = require('../models/Step');
const { createAndAssignSteps } = require('../services/assignSteps');

// POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const { clientName, itemDescription, deadline } = req.body;
    if (!clientName || !itemDescription || !deadline) {
      return res.status(400).json({
        message: 'clientName, itemDescription, deadline required',
      });
    }

    const order = await Order.create({
      studio: req.auth.studioId,
      clientName: clientName.trim(),
      itemDescription: itemDescription.trim(),
      deadline: new Date(deadline),
      createdBy: req.user._id,
      status: 'in_progress',
    });

    const steps = await createAndAssignSteps(order);

    res.status(201).json({
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
        assignedTo: s.assignedTo,
        status: s.status,
        startedAt: s.startedAt,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/orders
exports.listOrders = async (req, res) => {
  try {
    const orders = await Order.find({ studio: req.auth.studioId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
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
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/orders/:id
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      studio: req.auth.studioId,
    }).lean();

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const steps = await Step.find({ order: order._id })
      .populate('assignedTo', 'name skills')
      .sort({ sequence: 1 })
      .lean();

    res.json({
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
          ? { id: s.assignedTo._id, name: s.assignedTo.name, skills: s.assignedTo.skills }
          : null,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};