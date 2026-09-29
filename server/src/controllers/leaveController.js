const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const { calculateLeaveDays } = require('../utils/dateUtils');

/**
 * Preview leave calculation (working days, weekends, balance projection, overlap)
 */
const previewLeave = async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and End date are required for preview.'
      });
    }

    let calculation;
    try {
      calculation = calculateLeaveDays(startDate, endDate);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    let employee = null;
    let currentBalance = null;
    let projectedBalance = null;
    let hasSufficientBalance = true;
    let overlapConflict = null;

    if (employeeId) {
      employee = await Employee.findOne({ employeeId: employeeId.toUpperCase() });
      if (employee && leaveType) {
        const typeKey = leaveType.toLowerCase();
        currentBalance = employee.leaveBalances[typeKey] ?? 0;
        projectedBalance = currentBalance - calculation.workingDays;
        hasSufficientBalance = projectedBalance >= 0;
      }

      // Check overlap
      const existingConflict = await LeaveRequest.findOne({
        employeeId: employeeId.toUpperCase(),
        status: { $in: ['Pending', 'Approved'] },
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
      });

      if (existingConflict) {
        overlapConflict = {
          id: existingConflict._id,
          startDate: existingConflict.startDate,
          endDate: existingConflict.endDate,
          status: existingConflict.status,
          leaveType: existingConflict.leaveType
        };
      }
    }

    return res.json({
      success: true,
      data: {
        ...calculation,
        currentBalance,
        projectedBalance,
        hasSufficientBalance,
        hasZeroWorkingDays: calculation.workingDays === 0,
        overlapConflict
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to preview leave calculation',
      error: error.message
    });
  }
};

/**
 * Apply for leave
 */
const applyLeave = async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;

    // 1. Validation: Required fields
    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: employeeId, leaveType, startDate, endDate, and reason.'
      });
    }

    if (!['Casual', 'Sick'].includes(leaveType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave type. Must be either "Casual" or "Sick".'
      });
    }

    if (!reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a non-empty reason for leave.'
      });
    }

    // 2. Fetch Employee
    const employee = await Employee.findOne({ employeeId: employeeId.toUpperCase() });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID "${employeeId}" was not found.`
      });
    }

    // 3. Calculate Working Days & Weekend Handling
    let dayStats;
    try {
      dayStats = calculateLeaveDays(startDate, endDate);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // Edge Case: Leave range spans only weekend days (0 working days)
    if (dayStats.workingDays === 0) {
      return res.status(400).json({
        success: false,
        message: 'The selected date range contains only weekend days (Saturday/Sunday). Leaves are not required on non-working days.'
      });
    }

    // 4. Edge Case: Overlapping leave requests
    const overlappingRequest = await LeaveRequest.findOne({
      employeeId: employee.employeeId,
      status: { $in: ['Pending', 'Approved'] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    });

    if (overlappingRequest) {
      return res.status(400).json({
        success: false,
        code: 'OVERLAPPING_REQUEST',
        message: `Overlapping leave request detected: You already have a ${overlappingRequest.status.toLowerCase()} ${overlappingRequest.leaveType} leave request from ${overlappingRequest.startDate} to ${overlappingRequest.endDate}.`
      });
    }

    // 5. Edge Case: Insufficient leave balance
    const balanceKey = leaveType.toLowerCase();
    const currentBalance = employee.leaveBalances[balanceKey] || 0;

    if (dayStats.workingDays > currentBalance) {
      return res.status(400).json({
        success: false,
        code: 'INSUFFICIENT_BALANCE',
        message: `Insufficient leave balance. You requested ${dayStats.workingDays} working day(s) of ${leaveType} leave, but only have ${currentBalance} day(s) remaining.`
      });
    }

    // 6. Create Leave Request (balance is NOT deducted until approved)
    const newLeave = new LeaveRequest({
      employeeId: employee.employeeId,
      leaveType,
      startDate,
      endDate,
      totalDays: dayStats.totalDays,
      workingDays: dayStats.workingDays,
      weekendDays: dayStats.weekendDays,
      reason: reason.trim(),
      status: 'Pending'
    });

    await newLeave.save();

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully and is pending approval.',
      data: newLeave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit leave request',
      error: error.message
    });
  }
};

/**
 * Get leave requests with optional filters (status, employeeId)
 */
const getLeaveRequests = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (employeeId) {
      query.employeeId = employeeId.toUpperCase();
    }

    const requests = await LeaveRequest.find(query).sort({ createdAt: -1 });

    // Attach employee info
    const employeeIds = [...new Set(requests.map(r => r.employeeId))];
    const employees = await Employee.find({ employeeId: { $in: employeeIds } });
    const empMap = employees.reduce((acc, curr) => {
      acc[curr.employeeId] = curr;
      return acc;
    }, {});

    const enrichedRequests = requests.map(reqDoc => {
      const doc = reqDoc.toObject();
      const emp = empMap[doc.employeeId];
      return {
        ...doc,
        employeeName: emp ? emp.name : 'Unknown',
        department: emp ? emp.department : 'N/A',
        currentBalance: emp ? emp.leaveBalances[doc.leaveType.toLowerCase()] : 0
      };
    });

    res.json({
      success: true,
      count: enrichedRequests.length,
      data: enrichedRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests',
      error: error.message
    });
  }
};

/**
 * Manager action: Approve or Reject a leave request
 */
const reviewLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, managerComments, managerId } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Action must be "approve" or "reject".'
      });
    }

    const leaveRequest = await LeaveRequest.findById(id);
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.'
      });
    }

    if (leaveRequest.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot modify this request. It has already been marked as ${leaveRequest.status}.`
      });
    }

    const employee = await Employee.findOne({ employeeId: leaveRequest.employeeId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee ${leaveRequest.employeeId} not found.`
      });
    }

    const balanceKey = leaveRequest.leaveType.toLowerCase();

    if (action === 'approve') {
      // Re-verify balance at approval time (prevents race condition / over-allocation)
      const currentBalance = employee.leaveBalances[balanceKey] || 0;
      if (leaveRequest.workingDays > currentBalance) {
        return res.status(400).json({
          success: false,
          code: 'INSUFFICIENT_BALANCE_ON_APPROVAL',
          message: `Cannot approve request: ${employee.name} only has ${currentBalance} day(s) of ${leaveRequest.leaveType} leave remaining, but this request requires ${leaveRequest.workingDays} working day(s).`
        });
      }

      // Deduct balance
      employee.leaveBalances[balanceKey] -= leaveRequest.workingDays;
      await employee.save();

      leaveRequest.status = 'Approved';
      leaveRequest.managerComments = managerComments ? managerComments.trim() : 'Approved';
      leaveRequest.reviewedBy = managerId || 'Manager';
      leaveRequest.reviewedAt = new Date();
      await leaveRequest.save();

      return res.json({
        success: true,
        message: `Leave request approved. ${leaveRequest.workingDays} day(s) deducted from ${employee.name}'s ${leaveRequest.leaveType} leave balance.`,
        data: {
          leaveRequest,
          updatedBalances: employee.leaveBalances
        }
      });
    } else {
      // Reject action
      leaveRequest.status = 'Rejected';
      leaveRequest.managerComments = managerComments ? managerComments.trim() : 'Rejected';
      leaveRequest.reviewedBy = managerId || 'Manager';
      leaveRequest.reviewedAt = new Date();
      await leaveRequest.save();

      return res.json({
        success: true,
        message: `Leave request rejected. No leave balance was deducted.`,
        data: {
          leaveRequest,
          currentBalances: employee.leaveBalances
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process leave review',
      error: error.message
    });
  }
};

module.exports = {
  previewLeave,
  applyLeave,
  getLeaveRequests,
  reviewLeaveRequest
};
