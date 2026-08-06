const express = require('express');
const router = express.Router();

const paymentController = require('./payment.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

// Define protection layers
const protectPatient = [authMiddleware, roleMiddleware('patient')];
const adminProtect   = [authMiddleware, roleMiddleware('hospital_admin')];
const bothProtect    = [authMiddleware, roleMiddleware('patient', 'hospital_admin')];

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Billing and Payment management module with Razorpay integration
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         patient:
 *           type: string
 *           description: Patient reference ID
 *         doctor:
 *           type: string
 *           description: Doctor reference ID
 *         appointment:
 *           type: string
 *           description: Appointment reference ID
 *         razorpayOrderId:
 *           type: string
 *         razorpayPaymentId:
 *           type: string
 *         amount:
 *           type: number
 *         amountInPaise:
 *           type: number
 *         currency:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *         paymentMethod:
 *           type: string
 *         receiptUrl:
 *           type: string
 *         refundId:
 *           type: string
 *         refundAmount:
 *           type: number
 *         refundStatus:
 *           type: string
 *         paidAt:
 *           type: string
 *           format: date-time
 *     Invoice:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         invoiceNumber:
 *           type: string
 *         patient:
 *           type: string
 *         doctor:
 *           type: string
 *         appointment:
 *           type: string
 *         payment:
 *           type: string
 *         hospitalName:
 *           type: string
 *         hospitalAddress:
 *           type: string
 *         hospitalPhone:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unitPrice:
 *                 type: number
 *               totalPrice:
 *                 type: number
 *         subtotal:
 *           type: number
 *         tax:
 *           type: number
 *         discount:
 *           type: number
 *         totalAmount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [generated, sent, cancelled]
 *         issuedAt:
 *           type: string
 *           format: date-time
 */

// ==========================================
// Webhook Route (Public - called by Razorpay)
// ==========================================

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Razorpay Webhook listener (Public)
 *     description: Receives automatic event notifications from Razorpay (payment.captured, payment.failed, refund.processed)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Event received and processed successfully
 */
router.post('/webhook', paymentController.handleRazorpayWebhook);

// ==========================================
// Admin Routes (Put static paths before parameterized paths)
// ==========================================

/**
 * @swagger
 * /api/payments/all:
 *   get:
 *     summary: Get all payments in the system (Admin only)
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all payments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/all', adminProtect, paymentController.getPaymentHistory);

/**
 * @swagger
 * /api/payments/stats/revenue:
 *   get:
 *     summary: Get revenue and transaction statistics (Admin only)
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue statistics object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRevenue:
 *                   type: number
 *                 todayRevenue:
 *                   type: number
 *                 monthlyRevenue:
 *                   type: number
 *                 totalTransactions:
 *                   type: number
 *                 pendingCount:
 *                   type: number
 *                 failedCount:
 *                   type: number
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/stats/revenue', adminProtect, paymentController.getRevenueStats);

/**
 * @swagger
 * /api/payments/refund:
 *   post:
 *     summary: Initiate a refund for a paid transaction (Admin only)
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *             properties:
 *               paymentId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund initiated successfully
 *       400:
 *         description: Bad request (not paid or invalid status)
 *       403:
 *         description: Forbidden - Admin only
 */
router.post('/refund', adminProtect, paymentController.initiateRefund);

// ==========================================
// Invoice Routes
// ==========================================

/**
 * @swagger
 * /api/payments/invoice/{id}:
 *   get:
 *     summary: Get details of a specific Invoice
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invoice'
 *       403:
 *         description: Forbidden - Not owner or admin
 *       404:
 *         description: Invoice not found
 */
router.get('/invoice/:id', bothProtect, paymentController.getInvoiceById);

// ==========================================
// Patient / General Routes (Parameterized routes at the end)
// ==========================================

/**
 * @swagger
 * /api/payments/create-order:
 *   post:
 *     summary: Create a Razorpay Order
 *     description: Prepares a pending transaction for the selected appointment and generates a Razorpay Order ID.
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appointmentId
 *               - amount
 *             properties:
 *               appointmentId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Razorpay Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orderId:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 currency:
 *                   type: string
 *                 key:
 *                   type: string
 *                 paymentId:
 *                   type: string
 */
router.post('/create-order', protectPatient, paymentController.createOrder);

/**
 * @swagger
 * /api/payments/verify:
 *   post:
 *     summary: Verify payment signature
 *     description: Verifies the Razorpay payment signature, confirms the booking, and generates a PDF receipt.
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpayOrderId
 *               - razorpayPaymentId
 *               - razorpaySignature
 *               - paymentId
 *               - appointmentId
 *             properties:
 *               razorpayOrderId:
 *                 type: string
 *               razorpayPaymentId:
 *                 type: string
 *               razorpaySignature:
 *                 type: string
 *               paymentId:
 *                 type: string
 *               appointmentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment signature verified and booking confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 invoiceNumber:
 *                   type: string
 *                 receiptUrl:
 *                   type: string
 */
router.post('/verify', protectPatient, paymentController.verifyPayment);

/**
 * @swagger
 * /api/payments/history:
 *   get:
 *     summary: Get patient payment history
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of payments made by the logged-in patient
 */
router.get('/history', protectPatient, paymentController.getPaymentHistory);

/**
 * @swagger
 * /api/payments/{id}/download-receipt:
 *   get:
 *     summary: Download PDF receipt of a payment
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: PDF file downloaded
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/download-receipt', protectPatient, paymentController.downloadReceipt);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get details of a single Payment
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       403:
 *         description: Forbidden - Not owner or admin
 *       404:
 *         description: Payment not found
 */
router.get('/:id', bothProtect, paymentController.getPaymentById);

module.exports = router;
