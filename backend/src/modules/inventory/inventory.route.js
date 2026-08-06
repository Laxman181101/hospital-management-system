const express = require('express');
const router = express.Router();
const inventoryController = require('./inventory.controller');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Hospital Assets and Inventory Management
 */

// --- Inventory Items ---

/**
 * @swagger
 * /api/v1/inventory/items:
 *   post:
 *     summary: Add a new inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemName, category, quantity]
 *             properties:
 *               itemName:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Equipment, Consumable, Blood, Furniture, Medicine, Other]
 *               bloodGroup:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               reorderLevel:
 *                 type: number
 *               supplier:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item created
 */
router.post(
    '/items',
    protect,
    authorize('hospital_admin', 'inventory_manager', 'pharmacist'),
    inventoryController.createItem
);

/**
 * @swagger
 * /api/v1/inventory/items:
 *   get:
 *     summary: Get all inventory items
 *     tags: [Inventory]
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
 *         name: lowStock
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of items
 */
router.get(
    '/items',
    protect,
    inventoryController.getItems
);

/**
 * @swagger
 * /api/v1/inventory/items/{itemId}:
 *   patch:
 *     summary: Update inventory item details
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
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
 *               itemName:
 *                 type: string
 *               reorderLevel:
 *                 type: number
 *               supplier:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated
 */
router.patch(
    '/items/:itemId',
    protect,
    authorize('hospital_admin', 'inventory_manager', 'pharmacist'),
    inventoryController.updateItem
);

// --- Transactions ---

/**
 * @swagger
 * /api/v1/inventory/transactions:
 *   post:
 *     summary: Record a stock in/out transaction
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [item, transactionType, quantity]
 *             properties:
 *               item:
 *                 type: string
 *               transactionType:
 *                 type: string
 *                 enum: [In, Out]
 *               quantity:
 *                 type: number
 *               issuedTo:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction recorded
 */
router.post(
    '/transactions',
    protect,
    authorize('hospital_admin', 'inventory_manager', 'pharmacist'),
    inventoryController.recordTransaction
);

/**
 * @swagger
 * /api/v1/inventory/transactions:
 *   get:
 *     summary: Get all stock transactions
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: item
 *         schema:
 *           type: string
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of transactions
 */
router.get(
    '/transactions',
    protect,
    authorize('hospital_admin', 'inventory_manager', 'pharmacist'),
    inventoryController.getTransactions
);

module.exports = router;
