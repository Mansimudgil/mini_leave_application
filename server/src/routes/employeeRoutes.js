const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployeeById,
  resetBalances
} = require('../controllers/employeeController');

router.get('/', getEmployees);
router.get('/:id', getEmployeeById);
router.post('/reset-balances', resetBalances);

module.exports = router;
