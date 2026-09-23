import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const emptyForm = { name: '', sku: '', price: '', stock: '', lowStockThreshold: 10 };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const loadProducts = () => api.listProducts().then(setProducts).catch(() => {});

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createProduct({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
      });
      setForm(emptyForm);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <h1>Products</h1>

      <form onSubmit={handleSubmit} className="inline-form">
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input name="sku" placeholder="SKU" value={form.sku} onChange={handleChange} required />
        <input name="price" type="number" placeholder="Price" value={form.price} onChange={handleChange} required />
        <input name="stock" type="number" placeholder="Stock" value={form.stock} onChange={handleChange} required />
        <button type="submit">Add Product</button>
      </form>
      {error && <p className="error">{error}</p>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>SKU</th>
            <th>Price</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id}>
              <td>{p.name}</td>
              <td>{p.sku}</td>
              <td>₹{p.price}</td>
              <td className={p.stock <= p.lowStockThreshold ? 'low-stock' : ''}>{p.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
