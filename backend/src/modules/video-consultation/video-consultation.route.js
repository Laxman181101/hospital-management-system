const express = require('express');

const videoController = require('./video-consultation.controller');
const videoValidation = require('./video-consultation.validation');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: VideoConsultation
 *   description: Video Consultation Module
 */

/**
 * @swagger
 * /api/v1/video-consultations/create:
 *   post:
 *     summary: Video consultation create karna
 *     tags: [VideoConsultation]
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
    videoValidation.createValidation,
    videoController.create
);

/**
 * @swagger
 * /api/v1/video-consultations/generate-link:
 *   post:
 *     summary: Meeting link generate karna
 *     tags: [VideoConsultation]
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
    videoController.generateLink
);

/**
 * @swagger
 * /api/v1/video-consultations/doctor/{doctorId}:
 *   get:
 *     summary: Doctor ke video appointments fetch karna
 *     tags: [VideoConsultation]
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
    videoController.getDoctorAppointments
);

/**
 * @swagger
 * /api/v1/video-consultations/{id}:
 *   get:
 *     summary: Consultation details fetch karna
 *     tags: [VideoConsultation]
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
    videoController.getDetails
);

/**
 * @swagger
 * /api/v1/video-consultations/{id}/join:
 *   get:
 *     summary: Join consultation via link
 *     tags: [VideoConsultation]
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
    videoController.joinConsultation
);

/**
 * @swagger
 * /api/v1/video-consultations/{id}/status:
 *   put:
 *     summary: Meeting status update
 *     tags: [VideoConsultation]
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
    videoValidation.statusValidation,
    videoController.updateStatus
);

module.exports = router;
