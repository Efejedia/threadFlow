const express = require('express');
const router = express.Router();
const order = require('../controllers/orderController');
const { protect, requireOwner } = require('../middleware/auth');

router.use(protect, requireOwner);

router.post('/', order.createOrder);
router.get('/', order.listOrders);
router.get('/:id', order.getOrder);

module.exports = router;