const express = require('express');
const router = express.Router();
const wardController = require('./ward.controller');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Ward
 *   description: Ward Management and Patient Admissions (Nurse Role)
 */

// --- Admission Requests ---

/**
 * @swagger
 * /api/v1/ward/admission-requests:
 *   post:
 *     summary: Create an IPD Admission Request (Doctor only)
 *     tags: [Ward]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient, reason]
 *             properties:
 *               patient:
 *                 type: string
 *               consultationId:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [Normal, Urgent, Emergency]
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admission request created
 */
router.post(
    '/admission-requests',
    protect,
    authorize('doctor'),
    wardController.createAdmissionRequest
);

/**
 * @swagger
 * /api/v1/ward/admission-requests:
 *   get:
 *     summary: Get all admission requests
 *     tags: [Ward]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Admitted, Cancelled]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [Normal, Urgent, Emergency]
 *     responses:
 *       200:
 *         description: List of admission requests
 */
router.get(
    '/admission-requests',
    protect,
    authorize('hospital_admin', 'nurse', 'receptionist', 'doctor'),
    wardController.getAdmissionRequests
);

/**
 * @swagger
 * /api/v1/ward/admission-requests/{id}:
 *   patch:
 *     summary: Update an admission request (e.g., cancel it)
 *     tags: [Ward]
 *     security:
 *       - bearerAuth: []
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
 *               status:
 *                 type: string
 *                 enum: [Pending, Admitted, Cancelled]
 *     responses:
 *       200:
 *         description: Request updated
 */
router.patch(
    '/admission-requests/:id',
    protect,
    authorize('hospital_admin', 'nurse', 'receptionist', 'doctor'),
    wardController.updateAdmissionRequest
);

// --- Ward Management ---

/**
 * @swagger
 * /api/v1/ward/wards:
 *   post:
 *     summary: Create a new ward (e.g., General, ICU)
 *     tags: [Ward]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [wardName, wardType, totalBeds, pricePerDay]
 *             properties:
 *               wardName:
 *                 type: string
 *               wardType:
 *                 type: string
 *                 enum: [General, ICU, Private, Semi-Private, Maternity, Pediatric, Emergency, Other]
 *               totalBeds:
 *                 type: number
 *               pricePerDay:
 *                 type: number
 *     responses:
 *       201:
 *         description: Ward created
 */
router.post(
    '/wards',
    protect,
    authorize('super_admin', 'hospital_admin', 'receptionist'),
    wardController.createWard
);

/**
 * @swagger
 * /api/v1/ward/wards:
 *   get:
 *     summary: Get all wards and their bed availability
 *     tags: [Ward]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of wards
 */
router.get(
    '/wards',
    protect,
    wardController.getWards
);

// --- Bed Allocations (Admissions) ---

/**
 * @swagger
 * /api/v1/ward/admissions:
 *   post:
 *     summary: Admit a patient to a bed
 *     tags: [Ward]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient, ward, bedNumber]
 *             properties:
 *               patient:
 *                 type: string
 *               ward:
 *                 type: string
 *               bedNumber:
 *                 type: string
 *               primaryNurse:
 *                 type: string
 *               depositAmount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Patient admitted
 */
router.post(
    '/admissions',
    protect,
    authorize('hospital_admin', 'nurse', 'receptionist'),
    wardController.admitPatient
);

/**
 * @swagger
 * /api/v1/ward/admissions:
 *   get:
 *     summary: Get all patient admissions
 *     tags: [Ward]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Admitted, Discharge Requested, Discharged, Transferred]
 *     responses:
 *       200:
 *         description: List of admissions
 */
router.get(
    '/admissions',
    protect,
    wardController.getAdmissions
);

/**
 * @swagger
 * /api/v1/ward/admissions/{allocationId}/discharge:
 *   patch:
 *     summary: Discharge a patient and free the bed
 *     tags: [Ward]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: allocationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient discharged, returns allocation and draftBill
 */
router.patch(
    '/admissions/:allocationId/discharge',
    protect,
    authorize('hospital_admin', 'nurse', 'doctor', 'receptionist'),
    wardController.dischargePatient
);

/**
 * @swagger
 * /api/v1/ward/admissions/{admissionId}/assign-nurse:
 *   patch:
 *     summary: Assign a primary nurse to an admission
 *     tags: [Ward]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: admissionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nurseId]
 *             properties:
 *               nurseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nurse assigned
 */
router.patch(
    '/admissions/:admissionId/assign-nurse',
    protect,
    authorize('hospital_admin', 'nurse', 'receptionist'),
    wardController.assignNurse
);

/**
 * @swagger
 * /api/v1/ward/admissions/{id}/request-discharge:
 *   patch:
 *     summary: Request patient discharge
 *     tags: [Ward]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Discharge requested
 */
router.patch(
    '/admissions/:id/request-discharge',
    protect,
    authorize('doctor', 'hospital_admin', 'receptionist'),
    wardController.requestDischarge
);

// --- Patient Vitals ---

/**
 * @swagger
 * /api/v1/ward/vitals:
 *   post:
 *     summary: Record patient vitals
 *     tags: [Ward]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient, allocation]
 *             properties:
 *               patient:
 *                 type: string
 *               allocation:
 *                 type: string
 *               bloodPressure:
 *                 type: string
 *               heartRate:
 *                 type: number
 *               temperature:
 *                 type: number
 *               respiratoryRate:
 *                 type: number
 *               oxygenSaturation:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vitals recorded
 */
router.post(
    '/vitals',
    protect,
    authorize('nurse', 'doctor', 'receptionist', 'hospital_admin'),
    wardController.recordVitals
);

/**
 * @swagger
 * /api/v1/ward/admissions/{allocationId}/vitals:
 *   get:
 *     summary: Get vital history for a specific admission
 *     tags: [Ward]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: allocationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of vitals
 */
router.get(
    '/admissions/:allocationId/vitals',
    protect,
    wardController.getVitals
);

// --- IPD Daily Rounds ---

/**
 * @swagger
 * /api/v1/ward/admissions/{allocationId}/daily-rounds:
 *   post:
 *     summary: Add a daily round / doctor's order for an admitted patient
 *     tags: [Ward]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: allocationId
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
 *               roundType:
 *                 type: string
 *                 enum: [Morning, Evening, Night, Emergency]
 *               chiefComplaints:
 *                 type: string
 *               clinicalNotes:
 *                 type: string
 *               diagnosis:
 *                 type: string
 *               medications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     dose:
 *                       type: string
 *                     route:
 *                       type: string
 *                     frequency:
 *                       type: string
 *                     duration:
 *                       type: string
 *                     instructions:
 *                       type: string
 *               labOrdersRequested:
 *                 type: array
 *                 items:
 *                   type: string
 *               followUpPlan:
 *                 type: string
 *     responses:
 *       201:
 *         description: Daily round saved
 */
router.post(
    '/admissions/:allocationId/daily-rounds',
    protect,
    authorize('doctor'),
    wardController.createDailyRound
);

/**
 * @swagger
 * /api/v1/ward/admissions/{allocationId}/daily-rounds:
 *   get:
 *     summary: Get all daily rounds for an admission
 *     tags: [Ward]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: allocationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of daily rounds
 */
router.get(
    '/admissions/:allocationId/daily-rounds',
    protect,
    authorize('doctor', 'nurse', 'hospital_admin', 'receptionist'),
    wardController.getDailyRounds
);

/**
 * @swagger
 * /api/v1/ward/daily-rounds/{roundId}:
 *   get:
 *     summary: Get a single daily round by ID
 *     tags: [Ward]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Daily round detail
 */
router.get(
    '/daily-rounds/:roundId',
    protect,
    authorize('doctor', 'nurse', 'hospital_admin', 'receptionist', 'pharmacist'),
    wardController.getDailyRoundById
);

// --- Pharmacist: IPD Round Medications ---

/**
 * @swagger
 * /api/v1/ward/ipd-rounds:
 *   get:
 *     summary: Get all IPD daily rounds with medications (Pharmacist view)
 *     tags: [Ward]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dispensed
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Filter by dispensed status
 *     responses:
 *       200:
 *         description: List of IPD rounds with medications
 */
router.get(
    '/ipd-rounds',
    protect,
    authorize('pharmacist', 'hospital_admin', 'nurse'),
    wardController.getIpdRoundsForPharmacist
);

/**
 * @swagger
 * /api/v1/ward/ipd-rounds/{roundId}/dispense:
 *   patch:
 *     summary: Mark IPD round medications as dispensed to ward
 *     tags: [Ward]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Medications marked as dispensed
 */
router.patch(
    '/ipd-rounds/:roundId/dispense',
    protect,
    authorize('pharmacist', 'hospital_admin'),
    wardController.markMedicationsDispensed
);

module.exports = router;

