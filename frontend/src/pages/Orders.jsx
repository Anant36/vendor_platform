import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  const loadOrders = () => api.listOrders().then(setOrders).catch(() => {});

  useEffect(() => {
    loadOrders();
    api.listProducts().then(setProducts).catch(() => {});
  }, []);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createOrder({ items: [{ productId: selectedProduct, quantity: Number(quantity) }] });
      loadOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <h1>Orders</h1>

      <form onSubmit={handleCreateOrder} className="inline-form">
        <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} required>
          <option value="">Select product…</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} (stock: {p.stock})
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <button type="submit">Create Order</button>
      </form>
      {error && <p className="error">{error}</p>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Payment</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id}>
              <td>{o.orderNumber}</td>
              <td>{o.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}</td>
              <td>₹{o.totalAmount}</td>
              <td>
                <span className={`badge badge-${o.status}`}>{o.status}</span>
              </td>
              <td>{o.payment.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
