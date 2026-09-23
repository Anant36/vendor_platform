const Order = require('../models/Order');

// A lightweight AI assistant that answers natural-language questions about a
// vendor's own orders (e.g. "what's the status of my last order?").
// Uses the Anthropic Messages API. If no API key is configured, falls back
// to a simple rule-based answer so the feature is still demoable offline.
async function askAboutOrders(req, res) {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ message: 'question is required' });

    const orders = await Order.find({ vendor: req.user._id }).sort({ createdAt: -1 }).limit(10);
    const context = orders
      .map((o) => `Order ${o.orderNumber}: status=${o.status}, payment=${o.payment.status}, total=₹${o.totalAmount}`)
      .join('\n');

    if (!process.env.ANTHROPIC_API_KEY) {
      const latest = orders[0];
      const fallback = latest
        ? `Your most recent order ${latest.orderNumber} is currently "${latest.status}" (payment: ${latest.payment.status}).`
        : 'You have no orders yet.';
      return res.json({ answer: fallback, source: 'rule-based-fallback' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `Here is a vendor's recent order history:\n${context}\n\nAnswer this question concisely based only on the data above: "${question}"`,
          },
        ],
      }),
    });

    const data = await response.json();
    const answer = data.content?.[0]?.text || 'Sorry, I could not process that.';
    return res.json({ answer, source: 'ai' });
  } catch (err) {
    return res.status(500).json({ message: 'Assistant failed', error: err.message });
  }
}

module.exports = { askAboutOrders };
