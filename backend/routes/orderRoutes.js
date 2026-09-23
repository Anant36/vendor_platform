const express = require('express');
const { createOrder, listOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.post('/', createOrder);
router.get('/', listOrders);
router.patch('/:id/status', authorize('admin', 'dispatcher'), updateOrderStatus);

module.exports = router;
