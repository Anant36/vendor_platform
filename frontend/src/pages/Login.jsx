import React, { useState } from 'react';
import { api } from '../api/client.js';

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = isRegister
        ? await api.register({ ...form, role: 'vendor' })
        : await api.login(form);
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>{isRegister ? 'Create account' : 'Sign in'}</h1>
        {error && <p className="error">{error}</p>}

        {isRegister && (
          <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} required />
        )}
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Please wait…' : isRegister ? 'Register' : 'Login'}
        </button>

        <p className="switch-link" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
        </p>
      </form>
    </div>
  );
}
