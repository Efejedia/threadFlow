const Step = require('../models/Step');
const Order = require('../models/Order');

// GET /api/steps/mine  (staff)
exports.mySteps = async (req, res) => {
  try {
    const steps = await Step.find({
      studio: req.auth.studioId,
      assignedTo: req.staff._id,
      status: { $in: ['queued', 'active'] },
    })
      .populate('order', 'clientName itemDescription deadline status')
      .sort({ sequence: 1 })
      .lean();

    res.json({
      steps: steps.map((s) => ({
        id: s._id,
        name: s.name,
        sequence: s.sequence,
        status: s.status,
        startedAt: s.startedAt,
        order: s.order
          ? {
              id: s.order._id,
              clientName: s.order.clientName,
              itemDescription: s.order.itemDescription,
              deadline: s.order.deadline,
            }
          : null,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/steps/:id/complete  (staff)
exports.completeStep = async (req, res) => {
  try {
    const step = await Step.findOne({
      _id: req.params.id,
      studio: req.auth.studioId,
      assignedTo: req.staff._id,
    });

    if (!step) return res.status(404).json({ message: 'Step not found' });
    if (step.status === 'done') {
      return res.status(400).json({ message: 'Step already completed' });
    }

    step.status = 'done';
    step.completedAt = new Date();
    if (!step.startedAt) step.startedAt = step.completedAt;
    await step.save();

    // If all steps done → order done
    const remaining = await Step.countDocuments({
      order: step.order,
      status: { $ne: 'done' },
    });
    if (remaining === 0) {
      await Order.findByIdAndUpdate(step.order, { status: 'done' });
    }

    const durationMs =
      step.completedAt && step.startedAt
        ? step.completedAt - step.startedAt
        : null;

    res.json({
      step: {
        id: step._id,
        name: step.name,
        status: step.status,
        startedAt: step.startedAt,
        completedAt: step.completedAt,
        durationMs,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};