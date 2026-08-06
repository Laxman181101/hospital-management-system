const express = require('express');
const router = express.Router();
const financeController = require('./finance.controller');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Finance
 *   description: Hospital Expenses, Payroll and Financial Reports
 */

// --- Expenses ---

/**
 * @swagger
 * /api/v1/finance/expenses:
 *   post:
 *     summary: Record a new hospital expense
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [expenseName, category, amount]
 *             properties:
 *               expenseName:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Utility Bill, Maintenance, Equipment Purchase, Medicine Purchase, Marketing, Miscellaneous, Other]
 *               amount:
 *                 type: number
 *               dateIncurred:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Expense recorded
 */
router.post(
    '/expenses',
    protect,
    authorize('hospital_admin', 'financial_manager'),
    financeController.addExpense
);

/**
 * @swagger
 * /api/v1/finance/expenses:
 *   get:
 *     summary: Get hospital expenses
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of expenses
 */
router.get(
    '/expenses',
    protect,
    authorize('hospital_admin', 'financial_manager'),
    financeController.getExpenses
);

// --- Payroll ---

/**
 * @swagger
 * /api/v1/finance/payrolls:
 *   post:
 *     summary: Create a salary/payroll record for a staff member
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [staff, salaryMonth, basicSalary]
 *             properties:
 *               staff:
 *                 type: string
 *               salaryMonth:
 *                 type: string
 *                 example: '2023-10'
 *               basicSalary:
 *                 type: number
 *               bonus:
 *                 type: number
 *               deductions:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Pending, Paid]
 *     responses:
 *       201:
 *         description: Payroll created
 */
router.post(
    '/payrolls',
    protect,
    authorize('hospital_admin', 'financial_manager'),
    financeController.createPayroll
);

/**
 * @swagger
 * /api/v1/finance/payrolls:
 *   get:
 *     summary: Get all payroll records
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: salaryMonth
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of payrolls
 */
router.get(
    '/payrolls',
    protect,
    authorize('hospital_admin', 'financial_manager'),
    financeController.getPayrolls
);

/**
 * @swagger
 * /api/v1/finance/payrolls/{payrollId}/status:
 *   patch:
 *     summary: Update payroll status (e.g. mark as Paid)
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payrollId
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
 *                 enum: [Pending, Paid]
 *     responses:
 *       200:
 *         description: Payroll status updated
 */
router.patch(
    '/payrolls/:payrollId/status',
    protect,
    authorize('hospital_admin', 'financial_manager'),
    financeController.updatePayrollStatus
);

// --- Overview ---

/**
 * @swagger
 * /api/v1/finance/overview:
 *   get:
 *     summary: Get Financial Overview (Profit/Loss statement)
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Financial summary
 */
router.get(
    '/overview',
    protect,
    authorize('hospital_admin', 'financial_manager'),
    financeController.getOverview
);

module.exports = router;
