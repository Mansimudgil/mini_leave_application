const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
mongoose.set('bufferCommands', false);

const app = express();
app.use(cors());
app.use(express.json());

const Employee = require('./src/models/Employee');
const LeaveRequest = require('./src/models/LeaveRequest');
const employeeRoutes = require('./src/routes/employeeRoutes');
const leaveRoutes = require('./src/routes/leaveRoutes');

// In-memory fallback dataset in case MONGODB_URI is connecting or missing
const defaultEmployees = [
  { employeeId: 'EMP001', name: 'Mansi Sharma', email: 'mansi.sharma@example.com', department: 'Engineering', role: 'employee', leaveBalances: { casual: 10, sick: 10 }, initialBalances: { casual: 10, sick: 10 } },
  { employeeId: 'EMP002', name: 'Priya Patel', email: 'priya.patel@example.com', department: 'Operations & Management', role: 'manager', leaveBalances: { casual: 12, sick: 10 }, initialBalances: { casual: 12, sick: 10 } },
  { employeeId: 'EMP003', name: 'Rohan Verma', email: 'rohan.verma@example.com', department: 'Sales', role: 'employee', leaveBalances: { casual: 4, sick: 5 }, initialBalances: { casual: 10, sick: 10 } },
  { employeeId: 'EMP004', name: 'Ananya Iyer', email: 'ananya.iyer@example.com', department: 'Product Design', role: 'employee', leaveBalances: { casual: 8, sick: 7 }, initialBalances: { casual: 10, sick: 10 } },
  { employeeId: 'EMP005', name: 'Vikram Singh', email: 'vikram.singh@example.com', department: 'Marketing', role: 'employee', leaveBalances: { casual: 10, sick: 10 }, initialBalances: { casual: 10, sick: 10 } }
];

let isConnected = false;

const seedDefaultEmployees = async () => {
  try {
    const count = await Employee.countDocuments();
    if (count === 0) {
      await Employee.insertMany(defaultEmployees);
      console.log('Seeded default employees to MongoDB Atlas');
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
    console.warn('MONGODB_URI not found.');
    return;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    isConnected = true;
    console.log('Connected to MongoDB Atlas');
    await seedDefaultEmployees();
  } catch (err) {
    console.error('MongoDB Atlas connection failed:', err.message);
  }
};

// Middleware to try connecting to DB on each serverless invocation
app.use(async (req, res, next) => {
  await connectToDatabase();
  next();
});

// Fallback direct employee handler if Mongoose is not connected
const employeeFallbackHandler = (req, res, next) => {
  if (!isConnected || mongoose.connection.readyState !== 1) {
    return res.json({
      success: true,
      count: defaultEmployees.length,
      data: defaultEmployees,
      source: 'memory_fallback'
    });
  }
  next();
};

// Mount Routes with both /api prefix and root prefix
app.use('/api/employees', employeeFallbackHandler, employeeRoutes);
app.use('/employees', employeeFallbackHandler, employeeRoutes);

app.use('/api/leaves', leaveRoutes);
app.use('/leaves', leaveRoutes);

app.get(['/api/health', '/health', '/'], (req, res) => {
  res.json({
    status: 'ok',
    message: 'Leave Management API is healthy (Live on Vercel Serverless)',
    database: isConnected && mongoose.connection.readyState === 1 ? 'mongodb_atlas' : 'fallback',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
