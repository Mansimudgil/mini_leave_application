const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Cached DB connection for serverless performance
let isConnected = false;

const seedDefaultEmployees = async () => {
  const Employee = require('../server/src/models/Employee');
  try {
    const count = await Employee.countDocuments();
    if (count === 0) {
      const seedData = [
        { employeeId: 'EMP001', name: 'Mansi Sharma', email: 'mansi.sharma@example.com', department: 'Engineering', role: 'employee', leaveBalances: { casual: 10, sick: 10 }, initialBalances: { casual: 10, sick: 10 } },
        { employeeId: 'EMP002', name: 'Priya Patel', email: 'priya.patel@example.com', department: 'Operations & Management', role: 'manager', leaveBalances: { casual: 12, sick: 10 }, initialBalances: { casual: 12, sick: 10 } },
        { employeeId: 'EMP003', name: 'Rohan Verma', email: 'rohan.verma@example.com', department: 'Sales', role: 'employee', leaveBalances: { casual: 4, sick: 5 }, initialBalances: { casual: 10, sick: 10 } },
        { employeeId: 'EMP004', name: 'Ananya Iyer', email: 'ananya.iyer@example.com', department: 'Product Design', role: 'employee', leaveBalances: { casual: 8, sick: 7 }, initialBalances: { casual: 10, sick: 10 } },
        { employeeId: 'EMP005', name: 'Vikram Singh', email: 'vikram.singh@example.com', department: 'Marketing', role: 'employee', leaveBalances: { casual: 10, sick: 10 }, initialBalances: { casual: 10, sick: 10 } }
      ];
      await Employee.insertMany(seedData);
    }
  } catch (err) {
    console.error('Seeding error:', err.message);
  }
};

const connectToDatabase = async () => {
  if (isConnected && mongoose.connection.readyState >= 1) {
    return;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined. Please add it to your Vercel Environment Variables.');
  }
  await mongoose.connect(uri);
  isConnected = true;
  await seedDefaultEmployees();
};

app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to connect to MongoDB database',
      error: error.message
    });
  }
});

// Mount Routes
app.use('/api/employees', require('../server/src/routes/employeeRoutes'));
app.use('/api/leaves', require('../server/src/routes/leaveRoutes'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Leave Management API is healthy (Live on Vercel Serverless)',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
