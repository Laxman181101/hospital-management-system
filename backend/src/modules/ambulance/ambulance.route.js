const express = require('express');
const router = express.Router();
const ambulanceController = require('./ambulance.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Ambulance
 *   description: Ambulance Management APIs
 */

/**
 * @swagger
 * /api/v1/ambulances:
 *   get:
 *     summary: Get all ambulances (with their active dispatch data)
 *     tags: [Ambulance]
 *     responses:
 *       200:
 *         description: List of all ambulances
 */
router.get('/', ambulanceController.getAllAmbulances);

/**
 * @swagger
 * /api/v1/ambulances/available:
 *   get:
 *     summary: Get all available ambulances
 *     tags: [Ambulance]
 *     responses:
 *       200:
 *         description: List of available ambulances
 */
router.get('/available', ambulanceController.getAvailableAmbulances);

/**
 * @swagger
 * /api/v1/ambulances:
 *   post:
 *     summary: Add a new ambulance
 *     tags: [Ambulance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleNumber:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Basic, ALS, ICU]
 *               driverName:
 *                 type: string
 *               driverPhone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ambulance added successfully
 */
router.post('/', ambulanceController.addAmbulance);

/**
 * @swagger
 * /api/v1/ambulances/{id}:
 *   put:
 *     summary: Update ambulance details (e.g., driver)
 *     tags: [Ambulance]
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
 *               driverName:
 *                 type: string
 *               driverPhone:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Available, On-Duty, Maintenance]
 *     responses:
 *       200:
 *         description: Ambulance updated successfully
 */
router.put('/:id', ambulanceController.updateAmbulance);

/**
 * @swagger
 * /api/v1/ambulances/{id}/dispatch:
 *   post:
 *     summary: Dispatch an ambulance
 *     tags: [Ambulance]
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
 *               location:
 *                 type: string
 *               dropLocation:
 *                 type: string
 *               dispatchType:
 *                 type: string
 *                 enum: [Emergency, Referral]
 *               patientId:
 *                 type: string
 *               callerName:
 *                 type: string
 *               callerPhone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ambulance dispatched successfully
 */
router.post('/:id/dispatch', ambulanceController.dispatchAmbulance);

/**
 * @swagger
 * /api/v1/ambulances/dispatch/{dispatchId}/return:
 *   post:
 *     summary: Mark ambulance dispatch as returned
 *     tags: [Ambulance]
 *     parameters:
 *       - in: path
 *         name: dispatchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ambulance returned
 */
router.post('/dispatch/:dispatchId/return', ambulanceController.markAmbulanceReturned);

module.exports = router;
