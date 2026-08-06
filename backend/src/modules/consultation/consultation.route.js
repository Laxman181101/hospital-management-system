const express = require('express');

const consultationController = require('./consultation.controller');
const consultationValidation = require('./consultation.validation');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Consultation
 *   description: OPD Module for Doctors
 */

/**
 * @swagger
 * /api/v1/consultations:
 *   post:
 *     summary: Create a new consultation record (Doctor only)
 *     tags: [Consultation]
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
 *               - symptoms
 *               - diagnosis
 *             properties:
 *               patientId:
 *                 type: string
 *               appointmentId:
 *                 type: string
 *               symptoms:
 *                 type: string
 *               complaints:
 *                 type: string
 *               diagnosis:
 *                 type: string
 *               clinicalNotes:
 *                 type: string
 *               observations:
 *                 type: string
 *               followUpDate:
 *                 type: string
 *                 format: date
 *               followUpRecommendations:
 *                 type: string
 *     responses:
 *       201:
 *         description: Consultation created successfully
 *       400:
 *         description: Validation error
 *   get:
 *     summary: Get all consultations for the logged-in doctor
 *     tags: [Consultation]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of consultations
 */
router.post(
    '/',
    protect,
    authorize('doctor'),
    consultationValidation.createConsultationValidation,
    consultationController.createConsultation
);

router.get(
    '/',
    protect,
    authorize('doctor'),
    consultationController.getDoctorConsultations
);

/**
 * @swagger
 * /api/v1/consultations/appointments:
 *   get:
 *     summary: Get scheduled appointments and patient details for the logged-in doctor
 *     tags: [Consultation]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of scheduled appointments
 */
router.get(
    '/appointments',
    protect,
    authorize('doctor'),
    consultationController.getDoctorAppointments
);

/**
 * @swagger
 * /api/v1/consultations/patient/{id}:
 *   get:
 *     summary: Get specific patient details and medical history
 *     tags: [Consultation]
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
 *         description: Patient details and medical history
 *       404:
 *         description: Patient not found
 */
router.get(
    '/patient/:id',
    protect,
    authorize('doctor', 'super_admin', 'hospital_admin'),
    consultationController.getPatientDetails
);

/**
 * @swagger
 * /api/v1/consultations/{id}:
 *   get:
 *     summary: Get a specific consultation by ID
 *     tags: [Consultation]
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
 *         description: Consultation details
 *       404:
 *         description: Consultation not found
 */
router.get(
    '/:id/summary',
    protect,
    authorize('doctor', 'super_admin', 'hospital_admin', 'patient'),
    consultationController.getConsultationById
);

/**
 * @swagger
 * /api/v1/consultations/{id}/symptoms:
 *   post:
 *     summary: Add symptoms and complaints to a draft consultation
 *     tags: [Consultation]
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
 *               - symptoms
 *             properties:
 *               symptoms:
 *                 type: string
 *               complaints:
 *                 type: string
 *     responses:
 *       200:
 *         description: Symptoms added successfully
 */
router.post(
    '/:id/symptoms',
    protect,
    authorize('doctor'),
    consultationValidation.symptomsValidation,
    consultationController.addSymptoms
);

/**
 * @swagger
 * /api/v1/consultations/{id}/diagnosis:
 *   post:
 *     summary: Add diagnosis to a draft consultation
 *     tags: [Consultation]
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
 *               - diagnosis
 *             properties:
 *               diagnosis:
 *                 type: string
 *     responses:
 *       200:
 *         description: Diagnosis added successfully
 */
router.post(
    '/:id/diagnosis',
    protect,
    authorize('doctor'),
    consultationValidation.diagnosisValidation,
    consultationController.addDiagnosis
);

/**
 * @swagger
 * /api/v1/consultations/{id}/notes:
 *   post:
 *     summary: Add clinical notes to a draft consultation
 *     tags: [Consultation]
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
 *               - clinicalNotes
 *             properties:
 *               clinicalNotes:
 *                 type: string
 *               observations:
 *                 type: string
 *     responses:
 *       200:
 *         description: Clinical notes added successfully
 */
router.post(
    '/:id/notes',
    protect,
    authorize('doctor'),
    consultationValidation.notesValidation,
    consultationController.addNotes
);

/**
 * @swagger
 * /api/v1/consultations/{id}/followup:
 *   post:
 *     summary: Add follow-up and complete the consultation
 *     tags: [Consultation]
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
 *             properties:
 *               followUpDate:
 *                 type: string
 *                 format: date
 *               followUpRecommendations:
 *                 type: string
 *     responses:
 *       200:
 *         description: Follow-up added and status marked as completed
 */
router.post(
    '/:id/followup',
    protect,
    authorize('doctor'),
    consultationValidation.followupValidation,
    consultationController.addFollowup
);

module.exports = router;
