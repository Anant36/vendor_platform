const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const { notifyOrderConfirmed } = require('../services/notificationService');

function getClient() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Step 1: Create a Razorpay order tied to our internal order, return it to the frontend
// so the client-side checkout widget can open.
async function initiatePayment(req, res) {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const razorpay = getClient();
    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100), // paise
      currency: 'INR',
      receipt: order.orderNumber,
    });

    order.payment.razorpayOrderId = rzpOrder.id;
    await order.save();

    return res.json({ razorpayOrderId: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to initiate payment', error: err.message });
  }
}

// Step 2: Verify the signature Razorpay returns after checkout completes.
// This is the standard HMAC verification pattern - proves the payment wasn't tampered with.
async function verifyPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed: signature mismatch' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.payment.status = 'paid';
    order.payment.razorpayPaymentId = razorpay_payment_id;
    order.payment.paidAt = new Date();
    order.status = 'confirmed';
    await order.save();

    const vendor = await order.populate('vendor', 'email');
    notifyOrderConfirmed(order, vendor.vendor.email).catch((e) => console.error('notify failed', e));

    return res.json({ message: 'Payment verified', order });
  } catch (err) {
    return res.status(500).json({ message: 'Verification failed', error: err.message });
  }
}

module.exports = { initiatePayment, verifyPayment };
