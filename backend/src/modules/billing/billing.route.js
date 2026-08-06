const express = require('express');
const router = express.Router();
const billingController = require('./billing.controller');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Billing
 *   description: Invoicing and Payment Management APIs
 */

/**
 * @swagger
 * /api/v1/billing:
 *   post:
 *     summary: Generate a new invoice/bill
 *     description: Hospital Admins or Financial Managers can generate a new bill for a patient.
 *     tags: [Billing]
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
 *               - items
 *             properties:
 *               patient:
 *                 type: string
 *                 description: Auth User ID of the patient
 *                 example: 60c72b2f9b1d8b2bad7c3003
 *               appointment:
 *                 type: string
 *                 description: Optional Appointment ID to link with the payment
 *                 example: 60c72b2f9b1d8b2bad7c3004
 *               discount:
 *                 type: number
 *                 description: Discount amount in INR
 *                 example: 100
 *               tax:
 *                 type: number
 *                 description: Tax/GST amount in INR
 *                 example: 18
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, upi, net_banking, insurance]
 *                 default: cash
 *               paymentStatus:
 *                 type: string
 *                 enum: [unpaid, partially_paid, paid, refunded]
 *                 default: unpaid
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - description: Consultation fee
 *                     - amount: 500
 *                   properties:
 *                     description:
 *                       type: string
 *                       example: Doctor Consultation Fee
 *                     amount:
 *                       type: number
 *                       example: 500
 *                     quantity:
 *                       type: number
 *                       example: 1
 *     responses:
 *       201:
 *         description: Bill generated successfully
 *       400:
 *         description: Invalid input details or lack of hospital assignment
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 */
router.post(
    '/',
    protect,
    authorize('hospital_admin', 'financial_manager', 'pharmacist', 'receptionist', 'lab_technician', 'nurse'),
    billingController.createBilling
);

/**
 * @swagger
 * /api/v1/billing:
 *   get:
 *     summary: Retrieve list of invoices
 *     description: Retrieve all bills. Patients can only see their own bills. Staff/Admins can see their hospital's bills.
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [unpaid, partially_paid, paid, refunded]
 *         description: Filter invoices by payment status
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *         description: Filter invoices for a specific patient
 *     responses:
 *       200:
 *         description: List of billing invoices
 *       401:
 *         description: Unauthorized
 */
router.get(
    '/',
    protect,
    billingController.getBills
);

/**
 * @swagger
 * /api/v1/billing/collect-payment:
 *   post:
 *     summary: Collect decentralized payment (Pharmacy, Lab, Radiology, etc.) and log transaction
 *     tags: [Billing & Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [module, referenceId, amount, paymentMethod, patient]
 *             properties:
 *               module:
 *                 type: string
 *                 enum: [Appointment, Pharmacy, Laboratory, Radiology, IPD_Deposit, IPD_Final_Bill, Other]
 *               referenceId:
 *                 type: string
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [Cash, Card, UPI, Insurance]
 *               patient:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment collected successfully
 */
router.post(
    '/collect-payment',
    protect,
    authorize('receptionist', 'pharmacist', 'lab_technician', 'radiologist', 'financial_manager', 'hospital_admin'),
    billingController.collectPayment
);

/**
 * @swagger
 * /api/v1/billing/transactions:
 *   get:
 *     summary: Retrieve list of decentralized transactions
 *     description: Retrieve all transactions. Patients can only see their own transactions. Staff/Admins can see their hospital's transactions.
 *     tags: [Billing & Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *           enum: [Appointment, Pharmacy, Laboratory, Radiology, IPD_Deposit, IPD_Final_Bill, Other]
 *         description: Filter transactions by module
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *         description: Filter transactions for a specific patient
 *     responses:
 *       200:
 *         description: List of transactions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    '/transactions',
    protect,
    billingController.getTransactions
);

/**
 * @swagger
 * /api/v1/billing/{id}:
 *   get:
 *     summary: Retrieve a single billing invoice details
 *     description: Retrieve detailed information about a single bill by its ID. Patients can only view their own bills.
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The billing ID
 *     responses:
 *       200:
 *         description: Billing invoice details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (cross-tenant access denied)
 *       404:
 *         description: Invoice not found
 */
router.get(
    '/:id',
    protect,
    billingController.getBillById
);

/**
 * @swagger
 * /api/v1/billing/{id}/payment:
 *   patch:
 *     summary: Update payment status of an invoice
 *     description: Hospital Admins or Financial Managers can update the payment details and status of an invoice.
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The billing ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentStatus
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [unpaid, partially_paid, paid, refunded]
 *                 example: paid
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, upi, net_banking, insurance]
 *                 example: upi
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *       400:
 *         description: Invalid input details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       404:
 *         description: Invoice not found
 */
router.patch(
    '/:id/payment',
    protect,
    authorize('hospital_admin', 'financial_manager', 'pharmacist', 'receptionist', 'lab_technician', 'nurse'),
    billingController.updatePayment
);

/**
 * @swagger
 * /api/v1/billing/{id}/download:
 *   get:
 *     summary: Download PDF invoice
 *     description: Generates and streams a custom, high-end styled invoice PDF for download.
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The billing ID
 *     responses:
 *       200:
 *         description: Streams PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Invoice not found
 */
router.get(
    '/:id/download',
    protect,
    billingController.downloadInvoice
);


module.exports = router;
