const express = require('express');
const authController = require('./auth.controller');
const authValidation = require('./auth.validation');

const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { authRateLimiter } = require('../../middleware/rateLimiter');
const upload = require('../../middleware/upload.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and User Management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the user
 *         email:
 *           type: string
 *           format: email
 *           description: The email of the user
 *         mobile:
 *           type: string
 *           description: The mobile number of the user
 *         role:
 *           type: string
 *           enum: [super_admin, hospital_admin, doctor, patient, receptionist, pharmacist, lab_technician, nurse, inventory_manager, financial_manager]
 *           description: The role of the user
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     AuthResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *         token:
 *           type: string
 *           description: JWT Access Token
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a user with email or mobile, password, and specific role.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Required profile photo
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@hospital.com
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 minimum: 6
 *                 example: adminPassword123
 *               role:
 *                 type: string
 *                 enum: [super_admin, hospital_admin, doctor, patient]
 *                 default: patient
 *                 example: hospital_admin
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad Request (Invalid input, validation failure, or user already exists)
 */
router.post('/register', upload.any(), authValidation.registerValidation, authController.register);

/**
 * @swagger
 * /api/v1/auth/create-super-admin:
 *   post:
 *     summary: Create the first Super Admin (Hidden/Secure API)
 *     description: Creates a super_admin. Requires a secret key configured in the .env file.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - secretKey
 *               - firstName
 *               - email
 *               - mobile
 *               - password
 *             properties:
 *               secretKey:
 *                 type: string
 *                 example: your_env_secret_key_here
 *               firstName:
 *                 type: string
 *                 example: System
 *               lastName:
 *                 type: string
 *                 example: Owner
 *               email:
 *                 type: string
 *                 format: email
 *                 example: owner@hospitalapp.com
 *               mobile:
 *                 type: string
 *                 example: "9999999999"
 *               password:
 *                 type: string
 *                 minimum: 6
 *                 example: mySecurePassword
 *     responses:
 *       201:
 *         description: Super Admin created successfully
 *       400:
 *         description: Invalid secret key or missing fields
 */
router.post('/create-super-admin', authController.createSuperAdmin);

/**
 * @swagger
 * /api/v1/auth/register-staff:
 *   post:
 *     summary: Register a new staff member (Hospital Admin Only)
 *     description: Hospital admin can register a doctor, receptionist, pharmacist, or lab_technician under their hospital.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - email
 *               - mobile
 *               - role
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Required profile photo
 *               firstName:
 *                 type: string
 *                 example: Jane
 *               lastName:
 *                 type: string
 *                 example: Smith
 *               specialization:
 *                 type: string
 *                 example: Pathology
 *               experience:
 *                 type: number
 *                 example: 5
 *               qualifications:
 *                 type: string
 *                 example: B.Sc Nursing
 *               email:
 *                 type: string
 *                 format: email
 *                 example: staff@hospital.com
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 minimum: 6
 *                 example: staffPassword123
 *               role:
 *                 type: string
 *                 enum: [doctor, receptionist, pharmacist, lab_technician, nurse, inventory_manager, financial_manager]
 *                 example: financial_manager
 *     responses:
 *       201:
 *         description: Staff registered successfully
 *       400:
 *         description: Bad Request (Invalid input or user exists)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not a hospital_admin)
 */
router.post('/register-staff', protect, authorize('hospital_admin'), upload.any(), authValidation.registerStaffValidation, authController.registerStaff);

/**
 * @swagger
 * /api/v1/auth/staff:
 *   get:
 *     summary: Get all staff members (Super Admin / Hospital Admin)
 *     description: Retrieve a list of all staff (doctors, receptionists, pharmacists, lab_technicians). Super Admins can pass hospitalId in query to filter.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Optional role to filter staff (e.g., doctor, receptionist)
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *         description: Optional hospitalId to filter staff (for Super Admin only)
 *     responses:
 *       200:
 *         description: List of staff members
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/staff', protect, authorize('super_admin', 'hospital_admin', 'financial_manager', 'receptionist', 'nurse'), authController.getStaff);

/**
 * @swagger
 * /api/v1/auth/staff/{id}:
 *   get:
 *     summary: Get a specific staff member's profile (Super Admin / Hospital Admin)
 *     description: Retrieve detailed profile of a specific staff member.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *         description: Optional hospitalId (for Super Admin only)
 *     responses:
 *       200:
 *         description: Staff member profile
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Staff member not found
 */
router.get('/staff/:id', protect, authorize('super_admin', 'hospital_admin', 'financial_manager'), authController.getStaffById);

/**
 * @swagger
 * /api/v1/auth/staff/{id}:
 *   patch:
 *     summary: Update staff details (Hospital Admin Only)
 *     description: Update specific details (email, mobile, isApproved) of a staff member.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               mobile:
 *                 type: string
 *               email:
 *                 type: string
 *               isApproved:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Staff updated successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 */
router.patch('/staff/:id', protect, authorize('hospital_admin'), authController.updateStaff);

/**
 * @swagger
 * /api/v1/auth/staff/{id}:
 *   delete:
 *     summary: Deactivate a staff member (Hospital Admin Only)
 *     description: Soft deletes (deactivates) a staff member so they can no longer login.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff deactivated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Staff not found
 */
router.delete('/staff/:id', protect, authorize('hospital_admin'), authController.deleteStaff);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User Login (Email + Password)
 *     description: Login using registered email and password to receive a JWT access token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - loginId
 *               - password
 *             properties:
 *               loginId:
 *                 type: string
 *                 example: owner@hospitalapp.com OR 9999999999
 *               password:
 *                 type: string
 *                 example: mySecurePassword
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Unauthorized (Incorrect email or password)
 *       400:
 *         description: Email and password are required
 */
router.post('/login', authRateLimiter, authValidation.loginValidation, authController.login);

/**
 * @swagger
 * /api/v1/auth/request-otp:
 *   post:
 *     summary: Request OTP for Mobile Login
 *     description: Generate and send a 6-digit OTP to the registered mobile number (returned in response for testing).
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile
 *             properties:
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       200:
 *         description: OTP generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP sent successfully
 *                 otp:
 *                   type: string
 *                   description: The generated 6-digit OTP (returned only in development)
 *       400:
 *         description: Mobile number is required or user not found
 */
router.post('/request-otp', authRateLimiter, authValidation.requestOtpValidation, authController.requestOtp);

/**
 * @swagger
 * /api/v1/auth/login-with-otp:
 *   post:
 *     summary: Login with Mobile and OTP
 *     description: Authenticate user using their registered mobile number and received OTP.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile
 *               - otp
 *             properties:
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Authenticated successfully, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid or expired OTP
 *       400:
 *         description: Mobile number and OTP are required
 */
router.post('/login-with-otp', authRateLimiter, authValidation.loginWithOtpValidation, authController.loginWithOtp);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request Password Reset Token
 *     description: Request a reset token sent to the user's email if they forgot their password.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@hospital.com
 *     responses:
 *       200:
 *         description: Reset token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset token generated
 *                 resetToken:
 *                   type: string
 *       400:
 *         description: Email is required or user not found
 */
router.post('/forgot-password', authValidation.forgotPasswordValidation, authController.forgotPassword);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset User Password
 *     description: Reset password using the reset token and a new password.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: reset_token_value_here
 *               newPassword:
 *                 type: string
 *                 minimum: 6
 *                 example: newSecurePassword123
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successful
 *       400:
 *         description: Invalid/expired token or validation failure
 */
router.post('/reset-password', authValidation.resetPasswordValidation, authController.resetPassword);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   patch:
 *     summary: Change User Password
 *     description: Logged-in user can change their password by providing the old password and a new password.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: oldPassword123
 *               newPassword:
 *                 type: string
 *                 minimum: 6
 *                 example: newSecurePassword123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Incorrect old password or validation failure
 *       401:
 *         description: Unauthorized
 */
router.patch('/change-password', protect, authValidation.changePasswordValidation, authController.changePassword);

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary: Refresh Access Token
 *     description: Get a new access token using a valid long-lived refresh token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR...
 *     responses:
 *       200:
 *         description: New tokens generated successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: User Logout
 *     description: Invalidate/logout session.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 */
router.post('/logout', protect, authController.logout);

/**
 * @swagger
 * /api/v1/auth/pending-admins:
 *   get:
 *     summary: Get all pending hospital admins (Super Admin Only)
 *     description: Retrieve a list of all hospital_admins who have registered but are not yet approved.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending hospital admins
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/pending-admins', protect, authorize('super_admin'), authController.getPendingAdmins);

/**
 * @swagger
 * /api/v1/auth/approve/{id}:
 *   patch:
 *     summary: Approve a user account (Super Admin Only)
 *     description: Activates a pending hospital_admin account.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to approve
 *     responses:
 *       200:
 *         description: User approved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not super_admin)
 */
router.patch('/approve/:id', protect, authorize('super_admin'), authController.approveUser);

/**
 * @swagger
 * /api/v1/auth/profile/photo:
 *   patch:
 *     summary: Upload/Update Profile Photo
 *     description: Logged-in user can upload a profile photo. The photo is uploaded to Cloudinary.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile photo updated successfully
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 */
router.patch('/profile/photo', protect, upload.any(), authController.updateProfilePhoto);

module.exports = router;
