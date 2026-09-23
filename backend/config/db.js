const mongoose = require('mongoose');
const dns = require('dns');

// Fix for a known Windows + Node.js issue where Node's internal DNS resolver
// fails to resolve MongoDB Atlas SRV records even though the OS resolver
// (nslookup) works fine. Forcing Node to use Google's public DNS avoids it.
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function connectDB(uri) {
  try {
    await mongoose.connect(uri || process.env.MONGO_URI);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;