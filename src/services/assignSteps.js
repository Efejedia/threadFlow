const Staff = require('../models/Staff');
const Step = require('../models/Step');

// Default production pipeline for fashion studios
const DEFAULT_STEPS = ['cutting', 'sewing', 'finishing'];

async function getOpenLoad(studioId, staffId) {
  return Step.countDocuments({
    studio: studioId,
    assignedTo: staffId,
    status: { $in: ['queued', 'active'] },
  });
}

async function pickStaff(studioId, stepName, staffList) {
  const skill = stepName.toLowerCase();

  // Prefer staff who have this skill
  const skilled = staffList.filter(
    (s) =>
      s.isActive &&
      (s.skills || []).some((sk) => String(sk).toLowerCase() === skill)
  );

  // Fallback: any active staff
  const pool = skilled.length
    ? skilled
    : staffList.filter((s) => s.isActive);

  if (!pool.length) return null;

  const withLoad = await Promise.all(
    pool.map(async (s) => ({
      staff: s,
      load: await getOpenLoad(studioId, s._id),
    }))
  );

  withLoad.sort((a, b) => a.load - b.load);
  return withLoad[0].staff;
}

/**
 * Create steps for an order and assign staff.
 */
exports.createAndAssignSteps = async (order) => {
  const staffList = await Staff.find({
    studio: order.studio,
    isActive: true,
  });

  const created = [];

  for (let i = 0; i < DEFAULT_STEPS.length; i++) {
    const stepName = DEFAULT_STEPS[i];
    const assignee = await pickStaff(order.studio, stepName, staffList);

    const stepDoc = await Step.create({
      studio: order.studio,
      order: order._id,
      name: stepName,
      sequence: i + 1,
      assignedTo: assignee ? assignee._id : null,
      status: assignee ? 'active' : 'queued',
      startedAt: assignee ? new Date() : null,
    });

    created.push(stepDoc);
  }

  return created;
};