const express = require('express');

const prescriptionController = require('./prescription.controller');
const prescriptionValidation = require('./prescription.validation');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Prescription
 *   description: Digital Prescription Management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MedicineInput:
 *       type: object
 *       required:
 *         - name
 *         - dosage
 *         - frequency
 *         - duration
 *       properties:
 *         name:
 *           type: string
 *         dosage:
 *           type: string
 *         frequency:
 *           type: string
 *         duration:
 *           type: string
 *         instructions:
 *           type: string
 */

/**
 * @swagger
 * /api/v1/prescriptions:
 *   post:
 *     summary: Create a digital prescription (Doctor only)
 *     tags: [Prescription]
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
 *               - medicines
 *             properties:
 *               patientId:
 *                 type: string
 *               consultationId:
 *                 type: string
 *               medicines:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/MedicineInput'
 *               generalInstructions:
 *                 type: string
 *     responses:
 *       201:
 *         description: Prescription created and PDF generated
 *       400:
 *         description: Validation error
 */
router.post(
    '/',
    protect,
    authorize('doctor'),
    prescriptionValidation.createPrescriptionValidation,
    prescriptionController.createPrescription
);

/**
 * @swagger
 * /api/v1/prescriptions:
 *   get:
 *     summary: View all prescriptions for the hospital (Pharmacist/Admin)
 *     tags: [Prescription]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of prescriptions
 */
router.get(
    '/',
    protect,
    authorize('super_admin', 'hospital_admin', 'pharmacist', 'nurse', 'financial_manager', 'doctor'),
    prescriptionController.getAllPrescriptions
);

/**
 * @swagger
 * /api/v1/prescriptions/{id}:
 *   put:
 *     summary: Update an existing prescription (Doctor only)
 *     tags: [Prescription]
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
 *               medicines:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/MedicineInput'
 *               generalInstructions:
 *                 type: string
 *     responses:
 *       200:
 *         description: Prescription updated and PDF regenerated
 */
router.put(
    '/:id',
    protect,
    authorize('doctor'),
    prescriptionValidation.updatePrescriptionValidation,
    prescriptionController.updatePrescription
);

/**
 * @swagger
 * /api/v1/prescriptions/patient/me:
 *   get:
 *     summary: View logged-in patient's own prescriptions (Patient only)
 *     tags: [Prescription]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of prescriptions
 */
router.get(
    '/patient/me',
    protect,
    authorize('patient'),
    prescriptionController.getMyPrescriptions
);

/**
 * @swagger
 * /api/v1/prescriptions/patient/{patientId}:
 *   get:
 *     summary: View a patient's prescriptions (Doctor/Admin only)
 *     tags: [Prescription]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of prescriptions for the patient
 */
router.get(
    '/patient/:patientId',
    protect,
    authorize('doctor', 'super_admin', 'hospital_admin', 'pharmacist', 'nurse', 'financial_manager'),
    prescriptionController.getPatientPrescriptionsByDoctor
);

/**
 * @swagger
 * /api/v1/prescriptions/{id}:
 *   get:
 *     summary: View a specific prescription document by ID
 *     tags: [Prescription]
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
 *         description: Prescription details including PDF link
 */
router.get(
    '/:id',
    protect,
    authorize('doctor', 'patient', 'super_admin', 'hospital_admin', 'pharmacist', 'financial_manager'),
    prescriptionController.getPrescriptionById
);

module.exports = router;
