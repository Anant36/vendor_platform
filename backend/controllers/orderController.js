const Order = require('../models/Order');
const Product = require('../models/Product');
const { notifyLowStock } = require('../services/notificationService');

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${ts}-${rand}`;
}

// Core workflow: validate stock -> deduct stock -> create order -> fire low-stock alerts.
// This is the "manual order tracking -> automated pipeline" piece of the business case.
async function createOrder(req, res) {
  try {
    const { items, notes } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    const resolvedItems = [];
    let totalAmount = 0;
    const lowStockProducts = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        });
      }

      product.stock -= item.quantity;
      await product.save();
      if (product.isLowStock()) lowStockProducts.push(product);

      resolvedItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
      });
      totalAmount += product.price * item.quantity;
    }

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      vendor: req.user._id,
      items: resolvedItems,
      totalAmount,
      notes,
    });

    // Fire-and-forget automation: alert on any item that crossed the low-stock threshold.
    lowStockProducts.forEach((p) => notifyLowStock(p).catch((e) => console.error('notify failed', e)));

    return res.status(201).json(order);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create order', error: err.message });
  }
}

async function listOrders(req, res) {
  const filter = req.user.role === 'vendor' ? { vendor: req.user._id } : {};
  const orders = await Order.find(filter).sort({ createdAt: -1 });
  return res.json(orders);
}

async function updateOrderStatus(req, res) {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    await order.save();
    return res.json(order);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to update order', error: err.message });
  }
}

module.exports = { createOrder, listOrders, updateOrderStatus, generateOrderNumber };
