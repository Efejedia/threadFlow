const express = require('express');
const router = express.Router();

const {
  getOpsBrief,
  getAgentConfig,
  reassignOrder,
} = require('../controllers/agentController');

const { protect, requireOwner } = require('../middleware/auth');

router.get('/owner/ops-brief', protect, requireOwner, getOpsBrief);
router.get('/owner/agent/config', protect, requireOwner, getAgentConfig);
router.post('/orders/:id/assign', protect, requireOwner, reassignOrder);

module.exports = router;