const express = require('express');
const { initiatePayment, verifyPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.post('/:orderId/initiate', initiatePayment);
router.post('/verify', verifyPayment);

module.exports = router;
