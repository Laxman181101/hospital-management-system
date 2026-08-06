const express = require('express');
const router = express.Router();
const labController = require('./laboratory.controller');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const upload = require('../../middleware/upload.middleware');

/**
 * @swagger
 * tags:
 *   name: Laboratory
 *   description: Laboratory and Pathology Test Management
 */

// --- Lab Tests Inventory ---

/**
 * @swagger
 * /api/v1/laboratory/tests:
 *   post:
 *     summary: Add a new lab test to inventory
 *     tags: [Laboratory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [testName, category, price]
 *             properties:
 *               testName:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: ['Blood', 'Urine', 'X-Ray', 'MRI', 'CT Scan', 'Ultrasound', 'Pathology', 'Other']
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               turnaroundTime:
 *                 type: string
 *     responses:
 *       201:
 *         description: Test created
 */
router.post(
    '/tests',
    protect,
    authorize('hospital_admin', 'lab_technician'),
    labController.addTest
);

/**
 * @swagger
 * /api/v1/laboratory/tests:
 *   get:
 *     summary: Get available lab tests
 *     tags: [Laboratory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of tests
 */
router.get(
    '/tests',
    protect,
    labController.getTests
);

/**
 * @swagger
 * /api/v1/laboratory/tests/{testId}:
 *   patch:
 *     summary: Update a lab test details
 *     tags: [Laboratory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
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
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Test updated
 */
router.patch(
    '/tests/:testId',
    protect,
    authorize('hospital_admin', 'lab_technician'),
    labController.updateTest
);

/**
 * @swagger
 * /api/v1/laboratory/tests/{testId}:
 *   delete:
 *     summary: Delete a lab test
 *     tags: [Laboratory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test deleted
 */
router.delete(
    '/tests/:testId',
    protect,
    authorize('hospital_admin', 'lab_technician'),
    labController.deleteTest
);

// --- Lab Requests ---

/**
 * @swagger
 * /api/v1/laboratory/requests:
 *   post:
 *     summary: Create a patient lab request
 *     tags: [Laboratory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient, tests]
 *             properties:
 *               patient:
 *                 type: string
 *               doctor:
 *                 type: string
 *               tests:
 *                 type: array
 *                 items:
 *                   type: string
 *               paymentStatus:
 *                 type: string
 *                 enum: [Unpaid, Paid]
 *     responses:
 *       201:
 *         description: Request created
 */
router.post(
    '/requests',
    protect,
    authorize('lab_technician', 'hospital_admin', 'receptionist', 'doctor', 'financial_manager'),
    labController.createRequest
);

/**
 * @swagger
 * /api/v1/laboratory/requests:
 *   get:
 *     summary: Get lab requests
 *     tags: [Laboratory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: overallStatus
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of requests
 */
router.get(
    '/requests',
    protect,
    labController.getRequests
);

/**
 * @swagger
 * /api/v1/laboratory/requests/{requestId}:
 *   get:
 *     summary: Get single lab request details
 *     tags: [Laboratory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request details
 */
router.get(
    '/requests/:requestId',
    protect,
    labController.getRequestById
);

/**
 * @swagger
 * /api/v1/laboratory/requests/{requestId}/tests/{testItemId}/status:
 *   patch:
 *     summary: Update status of a specific test inside a request
 *     tags: [Laboratory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: testItemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending, Sample Collected, Completed, Cancelled]
 *               resultNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
    '/requests/:requestId/tests/:testItemId/status',
    protect,
    authorize('lab_technician'),
    labController.updateTestStatus
);

/**
 * @swagger
 * /api/v1/laboratory/requests/{requestId}/tests/{testItemId}/report:
 *   patch:
 *     summary: Upload lab test report document
 *     tags: [Laboratory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: testItemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Report uploaded
 */
router.patch(
    '/requests/:requestId/tests/:testItemId/report',
    protect,
    authorize('lab_technician'),
    upload.any(), // Using any to accept whatever field the frontend sends
    labController.uploadReport
);

module.exports = router;
