const express = require('express');
const router = express.Router();
const report = require('../controllers/reportController');
const { protect, requireOwner } = require('../middleware/auth');

router.get('/speed', protect, requireOwner, report.speedReport);

module.exports = router;