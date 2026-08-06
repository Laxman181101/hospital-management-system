const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const chatController = require('./chat-consultation.controller');
const chatValidation = require('./chat-consultation.validation');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

const router = express.Router();

// Multer Setup for Chat Uploads
const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * @swagger
 * tags:
 *   name: ChatConsultation
 *   description: Chat Consultation Module
 */

/**
 * @swagger
 * /api/v1/chat-consultations/create:
 *   post:
 *     summary: Create a new chat session
 *     tags: [ChatConsultation]
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
 *               - doctorId
 *             properties:
 *               patientId:
 *                 type: string
 *               doctorId:
 *                 type: string
 *               appointmentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Chat session created
 */
router.post(
    '/create',
    protect,
    authorize('doctor', 'patient'),
    chatValidation.createSessionValidation,
    chatController.createSession
);

/**
 * @swagger
 * /api/v1/chat-consultations/session/{sessionId}:
 *   get:
 *     summary: Get details of a specific chat session
 *     tags: [ChatConsultation]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session details fetched successfully
 */
router.get(
    '/session/:sessionId',
    protect,
    authorize('doctor', 'patient'),
    chatController.getSessionDetails
);

/**
 * @swagger
 * /api/v1/chat-consultations/session/{sessionId}/messages:
 *   get:
 *     summary: Get messages for a chat session
 *     tags: [ChatConsultation]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Messages fetched successfully
 */
router.get(
    '/session/:sessionId/messages',
    protect,
    authorize('doctor', 'patient'),
    chatController.getMessages
);

/**
 * @swagger
 * /api/v1/chat-consultations/send-message:
 *   post:
 *     summary: Send a message in a chat session
 *     tags: [ChatConsultation]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - content
 *             properties:
 *               sessionId:
 *                 type: string
 *               content:
 *                 type: string
 *               messageType:
 *                 type: string
 *                 enum: [text, image, document]
 *                 default: text
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post(
    '/send-message',
    protect,
    authorize('doctor', 'patient'),
    chatValidation.sendMessageValidation,
    chatController.sendMessage
);

/**
 * @swagger
 * /api/v1/chat-consultations/upload:
 *   post:
 *     summary: Upload an image or document for chat
 *     tags: [ChatConsultation]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded successfully, returns URL
 */
router.post(
    '/upload',
    protect,
    authorize('doctor', 'patient'),
    upload.single('file'),
    chatController.uploadFile
);

/**
 * @swagger
 * /api/v1/chat-consultations/session/{sessionId}/end:
 *   put:
 *     summary: End a chat session
 *     tags: [ChatConsultation]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session ended
 */
router.put(
    '/session/:sessionId/end',
    protect,
    authorize('doctor', 'patient'),
    chatController.endSession
);

module.exports = router;
