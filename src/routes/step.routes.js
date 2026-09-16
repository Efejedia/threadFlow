const express = require('express');
const router = express.Router();
const step = require('../controllers/stepController');
const { protect, requireStaff } = require('../middleware/auth');

router.get('/mine', protect, requireStaff, step.mySteps);
router.patch('/:id/complete', protect, requireStaff, step.completeStep);

module.exports = router;