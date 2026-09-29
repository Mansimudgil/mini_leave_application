const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');

/**
 * Get all employees
 */
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ employeeId: 1 });
    res.json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message
    });
  }
};

/**
 * Get employee by ID
 */
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOne({ employeeId: id.toUpperCase() });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee details',
      error: error.message
    });
  }
};

/**
 * Reset balances for demo/testing convenience
 */
const resetBalances = async (req, res) => {
  try {
    const seedData = [
      { employeeId: 'EMP001', name: 'Aarav Sharma', email: 'aarav.sharma@example.com', department: 'Engineering', role: 'employee', leaveBalances: { casual: 10, sick: 10 }, initialBalances: { casual: 10, sick: 10 } },
      { employeeId: 'EMP002', name: 'Priya Patel', email: 'priya.patel@example.com', department: 'Operations & Management', role: 'manager', leaveBalances: { casual: 12, sick: 10 }, initialBalances: { casual: 12, sick: 10 } },
      { employeeId: 'EMP003', name: 'Rohan Verma', email: 'rohan.verma@example.com', department: 'Sales', role: 'employee', leaveBalances: { casual: 4, sick: 5 }, initialBalances: { casual: 10, sick: 10 } },
      { employeeId: 'EMP004', name: 'Ananya Iyer', email: 'ananya.iyer@example.com', department: 'Product Design', role: 'employee', leaveBalances: { casual: 8, sick: 7 }, initialBalances: { casual: 10, sick: 10 } },
      { employeeId: 'EMP005', name: 'Vikram Singh', email: 'vikram.singh@example.com', department: 'Marketing', role: 'employee', leaveBalances: { casual: 10, sick: 10 }, initialBalances: { casual: 10, sick: 10 } }
    ];

    for (const item of seedData) {
      await Employee.findOneAndUpdate(
        { employeeId: item.employeeId },
        { $set: item },
        { upsert: true, new: true }
      );
    }

    // Clear old requests on demo reset for clean state
    await LeaveRequest.deleteMany({});

    res.json({
      success: true,
      message: 'Leave balances and employee profiles reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset balances',
      error: error.message
    });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  resetBalances
};
