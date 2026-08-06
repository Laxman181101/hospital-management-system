const express = require('express');
const doctorController = require('./doctor.controller');
const doctorValidation = require('./doctor.validation');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Doctors
 *   description: API for managing doctors
 */

/**
 * @swagger
 * /api/v1/doctors:
 *   get:
 *     summary: Get a list of doctors (Patients can view)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *         description: Filter doctors by specialization
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *         description: Filter doctors by hospital ID
 *     responses:
 *       200:
 *         description: A list of doctors
 */
// 1. Patient View (Any authenticated user can view doctors)
// Endpoint: GET /api/v1/doctors?specialization=Cardiology
router.get('/', protect, doctorController.getDoctors);

/**
 * @swagger
 * /api/v1/doctors:
 *   post:
 *     summary: Add a new doctor profile (Admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - hospitalId
 *               - name
 *               - specialization
 *               - consultationFee
 *             properties:
 *               userId:
 *                 type: string
 *               hospitalId:
 *                 type: string
 *               name:
 *                 type: string
 *               specialization:
 *                 type: string
 *               consultationFee:
 *                 type: number
 *               experience:
 *                 type: number
 *               qualifications:
 *                 type: array
 *                 items:
 *                   type: string
 *               availabilitySchedule:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                     endTime:
 *                       type: string
 *     responses:
 *       201:
 *         description: Doctor profile created successfully
 */
// 2. Hospital Admin Responsibilities
// Endpoint: POST /api/v1/doctors
router.post(
    '/', 
    protect, 
    authorize('hospital_admin', 'super_admin'), // Only admins can create doctor profiles
    doctorValidation.addDoctorValidation, 
    doctorController.addDoctor
);

/**
 * @swagger
 * /api/v1/doctors/profile:
 *   put:
 *     summary: Update own doctor profile (Doctor only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               specialization:
 *                 type: string
 *               consultationFee:
 *                 type: number
 *               experience:
 *                 type: number
 *               qualifications:
 *                 type: array
 *                 items:
 *                   type: string
 *               availabilitySchedule:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                     endTime:
 *                       type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
// 3. Doctor Capabilities
// Endpoint: PUT /api/v1/doctors/profile
router.put(
    '/profile', 
    protect, 
    authorize('doctor'), // Only a logged-in doctor can update their own profile
    doctorValidation.updateProfileValidation, 
    doctorController.updateOwnProfile
);

/**
 * @swagger
 * /api/v1/doctors/appointments:
 *   get:
 *     summary: View doctor appointments (Doctor only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns a list of appointments for the logged-in doctor
 */
// Endpoint: GET /api/v1/doctors/appointments
router.get(
    '/appointments', 
    protect, 
    authorize('doctor'), 
    doctorController.getDoctorAppointments
);

/**
 * @swagger
 * /api/v1/doctors/{id}/schedule:
 *   patch:
 *     summary: Update doctor schedule (Staff)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 */
// 5. Staff Responsibilities
// Endpoint: PATCH /api/v1/doctors/:id/schedule
router.patch(
    '/:id/schedule',
    protect,
    authorize('super_admin', 'hospital_admin', 'receptionist'),
    doctorController.updateSchedule
);

module.exports = router;
