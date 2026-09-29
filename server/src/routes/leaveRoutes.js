const express = require('express');
const router = express.Router();
const {
  previewLeave,
  applyLeave,
  getLeaveRequests,
  reviewLeaveRequest
} = require('../controllers/leaveController');

router.post('/preview', previewLeave);
router.post('/apply', applyLeave);
router.get('/', getLeaveRequests);
router.patch('/:id/review', reviewLeaveRequest);

module.exports = router;
