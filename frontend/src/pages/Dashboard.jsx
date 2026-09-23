import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    api.listOrders().then(setOrders).catch(() => {});
  }, []);

  const totalRevenue = orders
    .filter((o) => o.payment.status === 'paid')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const handleAsk = async (e) => {
    e.preventDefault();
    setAsking(true);
    setAnswer('');
    try {
      const res = await api.askAssistant(question);
      setAnswer(res.answer);
    } catch (err) {
      setAnswer(`Error: ${err.message}`);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="page">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Orders</span>
          <span className="stat-value">{orders.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Revenue (paid)</span>
          <span className="stat-value">₹{totalRevenue}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending Orders</span>
          <span className="stat-value">{orders.filter((o) => o.status === 'pending').length}</span>
        </div>
      </div>

      <div className="assistant-box">
        <h2>Ask about your orders</h2>
        <form onSubmit={handleAsk}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. what's the status of my latest order?"
          />
          <button type="submit" disabled={asking}>
            {asking ? 'Thinking…' : 'Ask'}
          </button>
        </form>
        {answer && <p className="assistant-answer">{answer}</p>}
      </div>
    </div>
  );
}
