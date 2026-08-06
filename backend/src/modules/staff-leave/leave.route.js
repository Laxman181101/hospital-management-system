const express = require('express');
const leaveController = require('./leave.controller');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

const router = express.Router();

// Apply for leave (All staff roles)
router.post('/apply', protect, leaveController.applyLeave);

// Get leave history
router.get('/', protect, leaveController.getHospitalLeaves);

// Approve or reject leave request (Admin only)
router.patch('/:id/status', protect, authorize('hospital_admin', 'super_admin'), leaveController.approveRejectLeave);

module.exports = router;
