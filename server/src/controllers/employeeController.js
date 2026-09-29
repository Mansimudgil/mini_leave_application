const Employee = require('../models/Employee');

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
    const employees = await Employee.find();
    for (const emp of employees) {
      emp.leaveBalances.casual = emp.initialBalances.casual || 10;
      emp.leaveBalances.sick = emp.initialBalances.sick || 10;
      await emp.save();
    }

    res.json({
      success: true,
      message: 'Leave balances reset to default quotas'
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
