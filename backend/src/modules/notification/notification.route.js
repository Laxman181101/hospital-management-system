const express = require('express');
const notificationController = require('./notification.controller');
const notificationValidation = require('./notification.validation');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notification
 *   description: Messaging & Notification Module (WhatsApp/SMS)
 */

/**
 * @swagger
 * /api/v1/notifications/send-custom:
 *   post:
 *     summary: Send a custom text message via WhatsApp or SMS
 *     tags: [Notification]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile
 *               - message
 *             properties:
 *               mobile:
 *                 type: string
 *               message:
 *                 type: string
 *               channel:
 *                 type: string
 *                 enum: [whatsapp, sms]
 *                 default: whatsapp
 *     responses:
 *       200:
 *         description: Message sent successfully
 */
router.post(
    '/send-custom',
    protect,
    authorize('hospital_admin', 'doctor', 'receptionist'),
    notificationValidation.sendCustomValidation,
    notificationController.sendCustomMessage
);

/**
 * @swagger
 * /api/v1/notifications/appointment-reminder:
 *   post:
 *     summary: Send an appointment reminder to a patient
 *     tags: [Notification]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - doctorName
 *               - date
 *             properties:
 *               patientId:
 *                 type: string
 *               doctorName:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               channel:
 *                 type: string
 *                 enum: [whatsapp, sms]
 *     responses:
 *       200:
 *         description: Reminder sent
 */
router.post(
    '/appointment-reminder',
    protect,
    authorize('hospital_admin', 'doctor', 'receptionist'),
    notificationValidation.reminderValidation,
    notificationController.triggerAppointmentReminder
);

/**
 * @swagger
 * /api/v1/notifications/followup-reminder:
 *   post:
 *     summary: Send a follow-up reminder to a patient
 *     tags: [Notification]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - doctorName
 *               - followUpDate
 *             properties:
 *               patientId:
 *                 type: string
 *               doctorName:
 *                 type: string
 *               followUpDate:
 *                 type: string
 *                 format: date
 *               followUpRecommendations:
 *                 type: string
 *               channel:
 *                 type: string
 *                 enum: [whatsapp, sms]
 *     responses:
 *       200:
 *         description: Follow-up reminder sent
 */
router.post(
    '/followup-reminder',
    protect,
    authorize('doctor', 'nurse'),
    notificationValidation.reminderValidation,
    notificationController.triggerFollowUpReminder
);

/**
 * @swagger
 * /api/v1/notifications/medication-reminder:
 *   post:
 *     summary: Send a medication schedule reminder to a patient
 *     tags: [Notification]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - medicines
 *             properties:
 *               patientId:
 *                 type: string
 *               medicines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     dosage:
 *                       type: string
 *                     frequency:
 *                       type: string
 *               channel:
 *                 type: string
 *                 enum: [whatsapp, sms]
 *     responses:
 *       200:
 *         description: Medication reminder sent
 */
router.post(
    '/medication-reminder',
    protect,
    authorize('doctor', 'nurse', 'pharmacist'),
    notificationValidation.reminderValidation,
    notificationController.triggerMedicationReminder
);

/**
 * @swagger
 * /api/v1/notifications/my-notifications:
 *   get:
 *     summary: Get all in-app notifications for logged-in user
 *     tags: [Notification]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get(
    '/my-notifications',
    protect,
    notificationController.getMyNotifications
);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notification]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch(
    '/:id/read',
    protect,
    notificationController.markAsRead
);

module.exports = router;
