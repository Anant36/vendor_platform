const cron = require('node-cron');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { notifyLowStock, sendEmail } = require('../services/notificationService');

// Runs every day at 8:00 AM - sweeps all products for anyone that dropped below
// threshold without triggering the real-time check (e.g. manual stock corrections).
function scheduleLowStockSweep() {
  cron.schedule('0 8 * * *', async () => {
    console.log('[automationJobs] Running daily low-stock sweep...');
    const products = await Product.find();
    const lowStock = products.filter((p) => p.isLowStock());
    await Promise.all(lowStock.map((p) => notifyLowStock(p)));
    console.log(`[automationJobs] Low-stock sweep complete. ${lowStock.length} alerts sent.`);
  });
}

// Runs every day at 9:00 PM - generates a same-day summary report and marks
// paid-but-uninvoiced orders as invoiced. Stands in for a real PDF invoice
// generator; the point demonstrated is the automated end-of-day batch job.
function scheduleDailyInvoiceReport() {
  cron.schedule('0 21 * * *', async () => {
    console.log('[automationJobs] Running daily invoice/report job...');
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todaysOrders = await Order.find({ createdAt: { $gte: startOfDay } });
    const uninvoiced = todaysOrders.filter((o) => o.payment.status === 'paid' && !o.invoiceGeneratedAt);

    for (const order of uninvoiced) {
      order.invoiceGeneratedAt = new Date();
      await order.save();
    }

    const totalRevenue = todaysOrders
      .filter((o) => o.payment.status === 'paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    await sendEmail({
      to: process.env.SMTP_USER,
      subject: `Daily report: ${todaysOrders.length} orders, ₹${totalRevenue} revenue`,
      text: `Orders today: ${todaysOrders.length}\nRevenue: ₹${totalRevenue}\nInvoices generated: ${uninvoiced.length}`,
    });

    console.log(`[automationJobs] Invoice job complete. ${uninvoiced.length} invoices generated.`);
  });
}

function startAllJobs() {
  scheduleLowStockSweep();
  scheduleDailyInvoiceReport();
  console.log('[automationJobs] Scheduled jobs registered.');
}

module.exports = { startAllJobs, scheduleLowStockSweep, scheduleDailyInvoiceReport };
