const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    ref: 'Employee'
  },
  leaveType: {
    type: String,
    required: true,
    enum: ['Casual', 'Sick']
  },
  startDate: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  endDate: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  totalDays: {
    type: Number,
    required: true,
    min: 1
  },
  workingDays: {
    type: Number,
    required: true,
    min: 1
  },
  weekendDays: {
    type: Number,
    default: 0,
    min: 0
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  managerComments: {
    type: String,
    trim: true,
    default: ''
  },
  reviewedBy: {
    type: String,
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Create index on employeeId and status for fast lookups
leaveRequestSchema.index({ employeeId: 1, status: 1 });
leaveRequestSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
