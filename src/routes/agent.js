const express = require('express');
const router = express.Router();

const {
  getOpsBrief,
  getAgentConfig,
  reassignOrder,
} = require('../controllers/agentController');

const { requireOwner } = require('../middleware/auth');

router.get('/owner/ops-brief', requireOwner, getOpsBrief);
router.get('/owner/agent/config', requireOwner, getAgentConfig);
router.post('/orders/:id/assign', requireOwner, reassignOrder);

module.exports = router;