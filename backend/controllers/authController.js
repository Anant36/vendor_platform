const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function register(req, res) {
  try {
    const { name, email, password, role, phone, businessName } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, role, phone, businessName });
    const token = signToken(user._id);
    return res.status(201).json({ user: user.toSafeObject(), token });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed', error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = signToken(user._id);
    return res.json({ user: user.toSafeObject(), token });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed', error: err.message });
  }
}

async function me(req, res) {
  return res.json({ user: req.user.toSafeObject() });
}

module.exports = { register, login, me };
