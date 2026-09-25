/**
 * Rule-based assignment agent (v1).
 * Can later be swapped for LLM / external agent.
 */

const DEFAULT_PIPELINE = [
  { name: 'Cutting', skill: 'cutting' },
  { name: 'Sewing', skill: 'sewing' },
  { name: 'Finishing', skill: 'finishing' },
];

function inferSteps(itemDescription = '') {
  const text = itemDescription.toLowerCase();
  const steps = [...DEFAULT_PIPELINE];

  // Insert beading before finishing when relevant
  if (text.includes('bead') || text.includes('embroidery') || text.includes('stone')) {
    steps.splice(steps.length - 1, 0, {
      name: 'Beading',
      skill: 'beading',
    });
  }

  return steps.map((s, i) => ({ ...s, orderIndex: i + 1 }));
}

function pickStaff(staffList, skill) {
  const candidates = staffList.filter(
    (s) =>
      s.isActive !== false &&
      Array.isArray(s.skills) &&
      s.skills.map((x) => x.toLowerCase()).includes(skill.toLowerCase())
  );

  const pool = candidates.length ? candidates : staffList.filter((s) => s.isActive !== false);

  if (!pool.length) return null;

  // Prefer lowest open task count
  return pool.slice().sort((a, b) => (a.openTasks || 0) - (b.openTasks || 0))[0];
}

/**
 * @param {Object} input
 * @param {Object} input.order - { itemDescription }
 * @param {Array} input.staff - [{ _id, name, skills, openTasks, isActive }]
 */
function assignOrderSteps({ order, staff }) {
  const baseSteps = inferSteps(order.itemDescription || order.item || '');

  const steps = baseSteps.map((step) => {
    const assignee = pickStaff(staff, step.skill);
    return {
      name: step.name,
      skill: step.skill,
      orderIndex: step.orderIndex,
      assigneeId: assignee ? assignee._id : null,
      assigneeName: assignee ? assignee.name : null,
    };
  });

  return { steps };
}

module.exports = { assignOrderSteps, inferSteps };