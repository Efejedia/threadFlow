const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { protect, requireOwner, requireStaff } = require('../middleware/auth');

router.post('/owner/register', authController.registerOwner);
router.post('/owner/login', authController.loginOwner);
router.get('/owner/me', protect, requireOwner, authController.ownerMe);

router.post('/staff/login', authController.loginStaff);
router.get('/staff/me', protect, requireStaff, authController.staffMe);

module.exports = router;