const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  department: {
    type: String,
    default: 'General'
  },
  role: {
    type: String,
    enum: ['employee', 'manager'],
    default: 'employee'
  },
  leaveBalances: {
    casual: {
      type: Number,
      default: 10,
      min: 0
    },
    sick: {
      type: Number,
      default: 10,
      min: 0
    }
  },
  initialBalances: {
    casual: {
      type: Number,
      default: 10
    },
    sick: {
      type: Number,
      default: 10
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Employee', employeeSchema);
