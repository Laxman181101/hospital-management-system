const express = require('express');
const router = express.Router();
const otController = require('./operation-theater.controller');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: OperationTheater
 *   description: API for managing OperationTheaters and Surgeries
 */

/**
 * @swagger
 * /api/v1/operation-theaters/rooms:
 *   post:
 *     summary: Create a new OperationTheater Room
 *     tags: [OperationTheater]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: General OT 1
 *               type:
 *                 type: string
 *                 enum: [General, Cardiac, Ortho, Gynae, ENT, Other]
 *                 example: General
 *               capacity:
 *                 type: number
 *                 example: 1
 *               description:
 *                 type: string
 *                 example: Main general surgery theater
 *     responses:
 *       201:
 *         description: OperationTheater created successfully
 *       400:
 *         description: Validation Error
 */
router.post('/rooms', authorize('receptionist'), otController.createOT);

/**
 * @swagger
 * /api/v1/operation-theaters/rooms:
 *   get:
 *     summary: Get all OperationTheater Rooms
 *     tags: [OperationTheater]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OperationTheaters fetched successfully
 */
router.get('/rooms', otController.getOTs);

/**
 * @swagger
 * /api/v1/operation-theaters/rooms/{id}:
 *   get:
 *     summary: Get an OperationTheater by ID
 *     tags: [OperationTheater]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The OT id
 *     responses:
 *       200:
 *         description: OperationTheater fetched successfully
 *       404:
 *         description: Not found
 */
router.get('/rooms/:id', otController.getOTById);

/**
 * @swagger
 * /api/v1/operation-theaters/rooms/{id}:
 *   put:
 *     summary: Update an OperationTheater Room
 *     tags: [OperationTheater]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Available, Occupied, Maintenance, Cleaning]
 *     responses:
 *       200:
 *         description: OperationTheater updated successfully
 */
router.put('/rooms/:id', authorize('receptionist'), otController.updateOT);

/**
 * @swagger
 * /api/v1/operation-theaters/rooms/{id}:
 *   delete:
 *     summary: Delete an OperationTheater Room
 *     tags: [OperationTheater]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OperationTheater deleted successfully
 */
router.delete('/rooms/:id', authorize('receptionist'), otController.deleteOT);

/**
 * @swagger
 * /api/v1/operation-theaters/surgeries:
 *   post:
 *     summary: Schedule a new Surgery
 *     tags: [OperationTheater]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - operationTheaterId
 *               - surgeonId
 *               - surgeryName
 *               - scheduledDate
 *               - startTime
 *               - endTime
 *             properties:
 *               patientId:
 *                 type: string
 *               operationTheaterId:
 *                 type: string
 *               surgeonId:
 *                 type: string
 *               anesthetistId:
 *                 type: string
 *               surgeryName:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *                 example: 10:00
 *               endTime:
 *                 type: string
 *                 example: 12:00
 *     responses:
 *       201:
 *         description: Surgery scheduled successfully
 */
router.post('/surgeries', authorize('receptionist', 'doctor', 'nurse'), otController.scheduleSurgery);

/**
 * @swagger
 * /api/v1/operation-theaters/requests:
 *   post:
 *     summary: Request a new Surgery (Doctor)
 *     tags: [OperationTheater]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Surgery requested successfully
 */
router.post('/requests', authorize('doctor'), otController.requestSurgery);

/**
 * @swagger
 * /api/v1/operation-theaters/surgeries/{id}/schedule:
 *   patch:
 *     summary: Approve and schedule a requested surgery (Receptionist)
 *     tags: [OperationTheater]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Surgery approved and scheduled successfully
 */
router.patch('/surgeries/:id/schedule', authorize('receptionist'), otController.approveSurgery);

/**
 * @swagger
 * /api/v1/operation-theaters/surgeries:
 *   get:
 *     summary: Get all Surgeries
 *     tags: [OperationTheater]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Surgeries fetched successfully
 */
router.get('/surgeries', otController.getSurgeries);

/**
 * @swagger
 * /api/v1/operation-theaters/surgeries/{id}:
 *   get:
 *     summary: Get a Surgery by ID
 *     tags: [OperationTheater]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Surgery fetched successfully
 */
router.get('/surgeries/:id', otController.getSurgeryById);

/**
 * @swagger
 * /api/v1/operation-theaters/surgeries/{id}/status:
 *   patch:
 *     summary: Update Surgery Status
 *     tags: [OperationTheater]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
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
 *                 enum: [Scheduled, In-Progress, Recovery, Completed, Cancelled]
 *               postOpNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Surgery status updated successfully
 */
router.patch('/surgeries/:id/status', authorize('receptionist', 'doctor', 'nurse'), otController.updateSurgeryStatus);

/**
 * @swagger
 * /api/v1/operation-theaters/surgeries/{id}/reschedule:
 *   patch:
 *     summary: Reschedule a Surgery
 *     tags: [OperationTheater]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduledDate
 *               - startTime
 *               - endTime
 *             properties:
 *               scheduledDate:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *                 example: 10:00
 *               endTime:
 *                 type: string
 *                 example: 12:00
 *               operationTheaterId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Surgery rescheduled successfully
 *       400:
 *         description: Validation or business logic error
 *       404:
 *         description: Surgery not found
 */
router.patch('/surgeries/:id/reschedule', authorize('receptionist', 'doctor', 'nurse'), otController.rescheduleSurgery);

module.exports = router;
