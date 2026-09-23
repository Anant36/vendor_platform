import React from 'react';
import { Link } from 'react-router-dom';

export default function Nav({ onLogout }) {
  return (
    <nav className="nav">
      <div className="nav-brand">Vendor Platform</div>
      <div className="nav-links">
        <Link to="/">Dashboard</Link>
        <Link to="/orders">Orders</Link>
        <Link to="/products">Products</Link>
        <button onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
}
