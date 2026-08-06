const express = require('express');
const router = express.Router();
const pharmacyController = require('./pharmacy.controller');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Pharmacy
 *   description: Pharmacy Inventory and Medicine Dispensing APIs
 */

/**
 * @swagger
 * /api/v1/pharmacy/medicines:
 *   post:
 *     summary: Add new medicine to inventory
 *     tags: [Pharmacy]
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
 *               - category
 *               - batchNumber
 *               - expiryDate
 *               - unitPrice
 *               - stockQuantity
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Tablet, Capsule, Syrup, Injection, Ointment, Drops, Inhaler, Other]
 *               manufacturer:
 *                 type: string
 *               batchNumber:
 *                 type: string
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *               unitPrice:
 *                 type: number
 *               stockQuantity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Medicine added successfully
 */
router.post(
    '/medicines',
    protect,
    authorize('hospital_admin', 'pharmacist'),
    pharmacyController.addMedicine
);

/**
 * @swagger
 * /api/v1/pharmacy/medicines:
 *   get:
 *     summary: Get list of medicines in inventory
 *     tags: [Pharmacy]
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
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of medicines
 */
router.get(
    '/medicines',
    protect,
    pharmacyController.getMedicines
);

/**
 * @swagger
 * /api/v1/pharmacy/medicines/{medicineId}:
 *   patch:
 *     summary: Update medicine inventory details
 *     tags: [Pharmacy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: medicineId
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
 *               unitPrice:
 *                 type: number
 *               stockQuantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Medicine updated successfully
 */
router.patch(
    '/medicines/:medicineId',
    protect,
    authorize('hospital_admin', 'pharmacist'),
    pharmacyController.updateMedicine
);

/**
 * @swagger
 * /api/v1/pharmacy/orders:
 *   post:
 *     summary: Create a pharmacy order (dispense medicines)
 *     tags: [Pharmacy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patient
 *               - medicines
 *             properties:
 *               patient:
 *                 type: string
 *               prescription:
 *                 type: string
 *               medicines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     medicine:
 *                       type: string
 *                     quantity:
 *                       type: number
 *               status:
 *                 type: string
 *                 enum: [Pending, Dispensed, Cancelled]
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post(
    '/orders',
    protect,
    authorize('pharmacist', 'hospital_admin'),
    pharmacyController.createOrder
);

/**
 * @swagger
 * /api/v1/pharmacy/orders:
 *   get:
 *     summary: Get list of pharmacy orders
 *     tags: [Pharmacy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patient
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get(
    '/orders',
    protect,
    pharmacyController.getOrders
);

/**
 * @swagger
 * /api/v1/pharmacy/orders/{orderId}/status:
 *   patch:
 *     summary: Update order status (Dispense or Cancel)
 *     tags: [Pharmacy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *                 enum: [Pending, Dispensed, Cancelled]
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch(
    '/orders/:orderId/status',
    protect,
    authorize('pharmacist', 'hospital_admin'),
    pharmacyController.updateOrderStatus
);

module.exports = router;
