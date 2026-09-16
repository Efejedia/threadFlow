const Step = require('../models/Step');
const Order = require('../models/Order');
const Staff = require('../models/Staff');

// GET /api/reports/speed
exports.speedReport = async (req, res) => {
  try {
    const studioId = req.auth.studioId;

    // Completed steps with duration
    const doneSteps = await Step.find({
      studio: studioId,
      status: 'done',
      startedAt: { $ne: null },
      completedAt: { $ne: null },
    })
      .populate('assignedTo', 'name skills')
      .populate('order', 'clientName itemDescription deadline status')
      .lean();

    // --- Per step type (cutting / sewing / finishing) ---
    const byStepType = {};
    for (const s of doneSteps) {
      const ms = new Date(s.completedAt) - new Date(s.startedAt);
      if (!byStepType[s.name]) {
        byStepType[s.name] = { count: 0, totalMs: 0 };
      }
      byStepType[s.name].count += 1;
      byStepType[s.name].totalMs += ms;
    }

    const stepAverages = Object.entries(byStepType).map(([name, v]) => ({
      step: name,
      completedCount: v.count,
      avgDurationMs: Math.round(v.totalMs / v.count),
      avgDurationHours: +(v.totalMs / v.count / 3600000).toFixed(2),
    }));

    // Slowest step type = bottleneck candidate
    const bottleneckStep =
      stepAverages.length > 0
        ? stepAverages.reduce((a, b) =>
            a.avgDurationMs > b.avgDurationMs ? a : b
          )
        : null;

    // --- Per staff ---
    const byStaff = {};
    for (const s of doneSteps) {
      if (!s.assignedTo) continue;
      const id = String(s.assignedTo._id);
      const ms = new Date(s.completedAt) - new Date(s.startedAt);
      if (!byStaff[id]) {
        byStaff[id] = {
          staffId: id,
          name: s.assignedTo.name,
          count: 0,
          totalMs: 0,
        };
      }
      byStaff[id].count += 1;
      byStaff[id].totalMs += ms;
    }

    const staffAverages = Object.values(byStaff).map((v) => ({
      staffId: v.staffId,
      name: v.name,
      completedCount: v.count,
      avgDurationMs: Math.round(v.totalMs / v.count),
      avgDurationHours: +(v.totalMs / v.count / 3600000).toFixed(2),
    }));

    // Slowest staff (among those with at least 1 completed step)
    const bottleneckStaff =
      staffAverages.length > 0
        ? staffAverages.reduce((a, b) =>
            a.avgDurationMs > b.avgDurationMs ? a : b
          )
        : null;

    // --- Per order turnaround ---
    const orders = await Order.find({ studio: studioId }).sort({ createdAt: -1 }).lean();
    const orderStats = [];

    for (const o of orders) {
      const steps = await Step.find({ order: o._id }).lean();
      const completed = steps.filter((s) => s.status === 'done' && s.startedAt && s.completedAt);
      if (completed.length === 0) {
        orderStats.push({
          orderId: o._id,
          clientName: o.clientName,
          status: o.status,
          stepCount: steps.length,
          completedSteps: 0,
          totalDurationMs: null,
          totalDurationHours: null,
        });
        continue;
      }

      const start = Math.min(...completed.map((s) => new Date(s.startedAt).getTime()));
      const end = Math.max(...completed.map((s) => new Date(s.completedAt).getTime()));
      const totalMs = end - start;

      orderStats.push({
        orderId: o._id,
        clientName: o.clientName,
        itemDescription: o.itemDescription,
        status: o.status,
        stepCount: steps.length,
        completedSteps: completed.length,
        totalDurationMs: totalMs,
        totalDurationHours: +(totalMs / 3600000).toFixed(2),
      });
    }

    // Open load per staff (who's overloaded right now)
    const staffList = await Staff.find({ studio: studioId, isActive: true }).lean();
    const workload = await Promise.all(
      staffList.map(async (s) => {
        const open = await Step.countDocuments({
          studio: studioId,
          assignedTo: s._id,
          status: { $in: ['queued', 'active'] },
        });
        return { staffId: s._id, name: s.name, openSteps: open, skills: s.skills };
      })
    );

    res.json({
      summary: {
        completedSteps: doneSteps.length,
        bottleneckStep: bottleneckStep
          ? {
              step: bottleneckStep.step,
              avgDurationHours: bottleneckStep.avgDurationHours,
              note: `${bottleneckStep.step} is the slowest step type on average`,
            }
          : null,
        bottleneckStaff: bottleneckStaff
          ? {
              name: bottleneckStaff.name,
              avgDurationHours: bottleneckStaff.avgDurationHours,
              note: `${bottleneckStaff.name} has the highest average step time`,
            }
          : null,
      },
      byStepType: stepAverages,
      byStaff: staffAverages,
      byOrder: orderStats,
      currentWorkload: workload,
    });
  } catch (err) {
    console.error('REPORT ERROR:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};