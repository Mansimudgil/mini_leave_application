const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./src/config/db');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect DB
connectDB().catch(console.error);

// Mount routes
app.use('/api/employees', require('./src/routes/employeeRoutes'));
app.use('/api/leaves', require('./src/routes/leaveRoutes'));
app.use('/employees', require('./src/routes/employeeRoutes'));
app.use('/leaves', require('./src/routes/leaveRoutes'));

// Health check endpoint
app.get(['/api/health', '/health', '/'], (req, res) => {
  res.json({
    status: 'ok',
    message: 'Mini Leave Request API is operational',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
