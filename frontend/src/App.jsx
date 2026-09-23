import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Orders from './pages/Orders.jsx';
import Products from './pages/Products.jsx';
import Nav from './components/Nav.jsx';

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return { token, login, logout };
}

function PrivateRoute({ token, children }) {
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { token, login, logout } = useAuth();

  return (
    <BrowserRouter>
      {token && <Nav onLogout={logout} />}
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" /> : <Login onLogin={login} />} />
        <Route
          path="/"
          element={
            <PrivateRoute token={token}>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <PrivateRoute token={token}>
              <Orders />
            </PrivateRoute>
          }
        />
        <Route
          path="/products"
          element={
            <PrivateRoute token={token}>
              <Products />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
