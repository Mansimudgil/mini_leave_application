const mongoose = require('mongoose');
const Employee = require('../models/Employee');

const seedDefaultEmployees = async () => {
  try {
    const count = await Employee.countDocuments();
    if (count === 0) {
      console.log('Seeding initial employees...');
      const seedData = [
        {
          employeeId: 'EMP001',
          name: 'Sarah Connor',
          email: 'sarah.connor@example.com',
          department: 'Engineering',
          role: 'employee',
          leaveBalances: { casual: 10, sick: 10 },
          initialBalances: { casual: 10, sick: 10 }
        },
        {
          employeeId: 'EMP002',
          name: 'Michael Scott',
          email: 'michael.scott@example.com',
          department: 'Management',
          role: 'manager',
          leaveBalances: { casual: 12, sick: 10 },
          initialBalances: { casual: 12, sick: 10 }
        },
        {
          employeeId: 'EMP003',
          name: 'Jim Halpert',
          email: 'jim.halpert@example.com',
          department: 'Sales',
          role: 'employee',
          leaveBalances: { casual: 4, sick: 5 },
          initialBalances: { casual: 10, sick: 10 }
        },
        {
          employeeId: 'EMP004',
          name: 'Pam Beesly',
          email: 'pam.beesly@example.com',
          department: 'Design',
          role: 'employee',
          leaveBalances: { casual: 8, sick: 7 },
          initialBalances: { casual: 10, sick: 10 }
        }
      ];

      await Employee.insertMany(seedData);
      console.log(`Seeded ${seedData.length} initial employees successfully.`);
    }
  } catch (err) {
    console.error('Error during employee seeding:', err.message);
  }
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log(`Connecting to MongoDB at: ${uri.replace(/\/\/.*@/, '//<credentials>@')}`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      await seedDefaultEmployees();
      return conn;
    } catch (error) {
      console.warn(`Could not connect to external MongoDB: ${error.message}`);
      console.log('Falling back to MongoMemoryServer for immediate zero-config operation...');
    }
  }

  // Fallback to in-memory MongoDB
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    console.log('Starting in-memory MongoDB server (zero external dependency mode)...');
    const mongod = await MongoMemoryServer.create();
    const memoryUri = mongod.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(`In-memory MongoDB Connected successfully: ${memoryUri}`);
    await seedDefaultEmployees();
    return conn;
  } catch (memError) {
    console.error('Fatal: Could not initialize database:', memError.message);
    throw memError;
  }
};

module.exports = { connectDB, seedDefaultEmployees };
