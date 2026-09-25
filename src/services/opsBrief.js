/**
 * Builds a short operational brief for Swift Agent.
 */

function daysBetween(a, b) {
  return Math.max(0, (b - a) / (1000 * 60 * 60 * 24));
}

function buildOpsBrief({ studioName, orders, steps, staff }) {
  const now = new Date();

  const openOrders = orders.filter((o) =>
    ['open', 'in_progress', 'assigned'].includes(o.status)
  );

  const overdueOrders = openOrders.filter(
    (o) => o.dueDate && new Date(o.dueDate) < now
  );

  // Avg duration by step name (completed only)
  const durationMap = {};
  for (const s of steps) {
    if (s.status !== 'done' || !s.startedAt || !s.completedAt) continue;
    const days = daysBetween(new Date(s.startedAt), new Date(s.completedAt));
    if (!durationMap[s.name]) durationMap[s.name] = [];
    durationMap[s.name].push(days);
  }

  let slowestStep = null;
  for (const [name, arr] of Object.entries(durationMap)) {
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    if (!slowestStep || avg > slowestStep.avgDays) {
      slowestStep = { name, avgDays: Number(avg.toFixed(1)) };
    }
  }

  // Staff workload from open steps
  const load = {};
  for (const s of steps) {
    if (!s.assigneeId) continue;
    if (!['assigned', 'in_progress', 'pending'].includes(s.status)) continue;
    const key = String(s.assigneeId);
    load[key] = (load[key] || 0) + 1;
  }

  let busiestStaff = null;
  let freestStaff = null;

  for (const person of staff) {
    if (person.isActive === false) continue;
    const tasks = load[String(person._id)] || 0;
    const row = { name: person.name, tasks };

    if (!busiestStaff || tasks > busiestStaff.tasks) busiestStaff = row;
    if (!freestStaff || tasks < freestStaff.tasks) freestStaff = row;
  }

  const overdueNames = overdueOrders
    .slice(0, 3)
    .map((o) => o.clientName || o.itemDescription || 'Order')
    .join(', ');

  const parts = [
    `${openOrders.length} open order${openOrders.length === 1 ? '' : 's'}`,
    `${overdueOrders.length} overdue${overdueNames ? ` (${overdueNames})` : ''}`,
  ];

  if (slowestStep) {
    parts.push(
      `Slowest step: ${slowestStep.name} (avg ${slowestStep.avgDays} days)`
    );
  }

  if (busiestStaff) {
    parts.push(
      `Busiest: ${busiestStaff.name} (${busiestStaff.tasks} task${
        busiestStaff.tasks === 1 ? '' : 's'
      })`
    );
  }

  if (freestStaff && freestStaff.name !== busiestStaff?.name) {
    parts.push(
      `Lightest load: ${freestStaff.name} (${freestStaff.tasks})`
    );
  }

  const text = `${studioName ? studioName + ': ' : ''}${parts.join('. ')}.`;

  return {
    text,
    openOrders: openOrders.length,
    overdueOrders: overdueOrders.length,
    slowestStep,
    busiestStaff,
    freestStaff,
    generatedAt: now.toISOString(),
  };
}

module.exports = { buildOpsBrief };