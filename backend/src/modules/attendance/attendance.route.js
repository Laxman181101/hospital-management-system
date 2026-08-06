const express = require('express');
const attendanceController = require('./attendance.controller');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

const router = express.Router();

// Self check-in (Any staff role)
router.post('/check-in', protect, attendanceController.checkIn);

// Self check-out (Any staff role)
router.post('/check-out', protect, attendanceController.checkOut);

// Self report delay (Any staff role)
router.post('/delay', protect, attendanceController.reportDelay);

// Mark/Override attendance (Hospital Admin or Receptionist only)
router.post('/mark', protect, authorize('hospital_admin', 'receptionist', 'super_admin'), attendanceController.markAttendance);

// Get hospital attendance logs (Hospital Admin or Receptionist only)
router.get('/', protect, authorize('hospital_admin', 'receptionist', 'super_admin'), attendanceController.getHospitalAttendance);

module.exports = router;
