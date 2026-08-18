const express = require('express');
const dashboardController = require('./dashboard.controller');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard analytics endpoints
 */

/**
 * @swagger
 * /api/v1/dashboard/super-admin/summary:
 *   get:
 *     summary: Get Super Admin Summary
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved summary.
 */
router.get(
    '/super-admin/summary',
    protect,
    authorize('super_admin'),
    dashboardController.getSuperAdminSummary
);

/**
 * @swagger
 * /api/v1/dashboard/super-admin/analytics:
 *   get:
 *     summary: Get Super Admin Analytics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved platform analytics.
 */
router.get(
    '/super-admin/analytics',
    protect,
    authorize('super_admin'),
    dashboardController.getSuperAdminAnalytics
);

/**
 * @swagger
 * /api/v1/dashboard/hospital-admin/summary:
 *   get:
 *     summary: Get Hospital Admin Summary
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved summary.
 */
router.get(
    '/hospital-admin/summary',
    protect,
    authorize('hospital_admin'),
    dashboardController.getHospitalAdminSummary
);

/**
 * @swagger
 * /api/v1/dashboard/doctor/complete:
 *   get:
 *     summary: Get Complete Doctor Dashboard Data in a single call
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved complete dashboard data.
 */
router.get(
    '/doctor/complete',
    protect,
    authorize('doctor'),
    dashboardController.getCompleteDoctorDashboard
);

/**
 * @swagger
 * /api/v1/dashboard/doctor/summary:
 *   get:
 *     summary: Get Doctor Summary
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved summary.
 */
router.get(
    '/doctor/summary',
    protect,
    authorize('doctor'),
    dashboardController.getDoctorSummary
);

/**
 * @swagger
 * /api/v1/dashboard/appointments/stats:
 *   get:
 *     summary: Get Appointments Statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved stats.
 */
router.get(
    '/appointments/stats',
    protect,
    authorize('super_admin', 'hospital_admin', 'doctor', 'receptionist'),
    dashboardController.getAppointmentStats
);

/**
 * @swagger
 * /api/v1/dashboard/patients/stats:
 *   get:
 *     summary: Get Patient Statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved stats.
 */
router.get(
    '/patients/stats',
    protect,
    authorize('super_admin', 'hospital_admin', 'doctor', 'receptionist'),
    dashboardController.getPatientStats
);

/**
 * @swagger
 * /api/v1/dashboard/revenue/summary:
 *   get:
 *     summary: Get Revenue Summary
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved summary.
 */
router.get(
    '/revenue/summary',
    protect,
    authorize('super_admin', 'hospital_admin', 'doctor'),
    dashboardController.getRevenueSummary
);

/**
 * @swagger
 * /api/v1/dashboard/platform-usage:
 *   get:
 *     summary: Get Platform Usage
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved platform usage.
 */
router.get(
    '/platform-usage',
    protect,
    authorize('super_admin'),
    dashboardController.getPlatformUsage
);

module.exports = router;
