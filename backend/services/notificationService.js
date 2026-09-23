const nodemailer = require('nodemailer');

function buildTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendEmail({ to, subject, text }) {
  // In test/dev without SMTP creds configured, log instead of throwing -
  // keeps the automation flow demonstrable without real credentials.
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[notificationService] (dry-run) To: ${to} | Subject: ${subject}\n${text}`);
    return { dryRun: true };
  }
  const transport = buildTransport();
  return transport.sendMail({ from: process.env.SMTP_USER, to, subject, text });
}

async function notifyLowStock(product) {
  return sendEmail({
    to: process.env.SMTP_USER,
    subject: `Low stock alert: ${product.name}`,
    text: `Product "${product.name}" (SKU: ${product.sku}) has ${product.stock} units left, below threshold of ${product.lowStockThreshold}.`,
  });
}

async function notifyOrderConfirmed(order, vendorEmail) {
  return sendEmail({
    to: vendorEmail,
    subject: `Order ${order.orderNumber} confirmed`,
    text: `Your order ${order.orderNumber} for ₹${order.totalAmount} has been confirmed and payment received.`,
  });
}

module.exports = { sendEmail, notifyLowStock, notifyOrderConfirmed };
