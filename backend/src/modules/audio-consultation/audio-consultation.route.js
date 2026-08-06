const express = require('express');
const audioController = require('./audio-consultation.controller');
const audioValidation = require('./audio-consultation.validation');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AudioConsultation
 *   description: Audio Consultation Module
 */

/**
 * @swagger
 * /api/v1/audio-consultations/create:
 *   post:
 *     summary: Create an audio consultation
 *     tags: [AudioConsultation]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - scheduledDate
 *             properties:
 *               patientId:
 *                 type: string
 *               appointmentId:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
    '/create',
    protect,
    authorize('doctor', 'patient'),
    audioValidation.createValidation,
    audioController.create
);

/**
 * @swagger
 * /api/v1/audio-consultations/generate-link:
 *   post:
 *     summary: Generate audio meeting link
 *     tags: [AudioConsultation]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Link generated
 */
router.post(
    '/generate-link',
    protect,
    authorize('doctor', 'patient'),
    audioController.generateLink
);

/**
 * @swagger
 * /api/v1/audio-consultations/doctor/{doctorId}:
 *   get:
 *     summary: Get a doctor's audio appointments
 *     tags: [AudioConsultation]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of appointments
 */
router.get(
    '/doctor/:doctorId',
    protect,
    authorize('doctor', 'super_admin', 'hospital_admin'),
    audioController.getDoctorAppointments
);

/**
 * @swagger
 * /api/v1/audio-consultations/{id}:
 *   get:
 *     summary: Get consultation details
 *     tags: [AudioConsultation]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Details fetched
 */
router.get(
    '/:id',
    protect,
    authorize('doctor', 'patient', 'super_admin', 'hospital_admin'),
    audioController.getDetails
);

/**
 * @swagger
 * /api/v1/audio-consultations/{id}/join:
 *   get:
 *     summary: Join audio consultation
 *     tags: [AudioConsultation]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns meeting link
 */
router.get(
    '/:id/join',
    protect,
    authorize('doctor', 'patient'),
    audioController.joinConsultation
);

/**
 * @swagger
 * /api/v1/audio-consultations/{id}/status:
 *   put:
 *     summary: Update audio meeting status
 *     tags: [AudioConsultation]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [scheduled, ongoing, completed, cancelled]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put(
    '/:id/status',
    protect,
    authorize('doctor'),
    audioValidation.statusValidation,
    audioController.updateStatus
);

module.exports = router;
