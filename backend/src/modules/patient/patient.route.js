const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const patientController = require('./patient.controller');
const patientValidation = require('./patient.validation');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

const router = express.Router();
const cloudinaryUpload = require('../../middleware/upload.middleware');

// Multer Storage Configuration
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
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only JPEG, JPG, PNG, and PDF files are allowed'));
    }
});

// Middleware helper to handle multer error
const uploadHandler = (req, res, next) => {
    upload.single('report')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: Patient management module
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MedicalHistory:
 *       type: object
 *       properties:
 *         condition:
 *           type: string
 *         diagnosedDate:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *           enum: [active, resolved]
 *         notes:
 *           type: string
 *     Report:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         filePath:
 *           type: string
 *         uploadedAt:
 *           type: string
 *           format: date-time
 *     AppointmentHistory:
 *       type: object
 *       properties:
 *         doctorName:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [scheduled, completed, cancelled]
 *         notes:
 *           type: string
 *         type:
 *           type: string
 *           enum: [in-person, video]
 *         meetingLink:
 *           type: string
 *     Medicine:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         dosage:
 *           type: string
 *         frequency:
 *           type: string
 *         duration:
 *           type: string
 *     PrescriptionHistory:
 *       type: object
 *       properties:
 *         doctorName:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         medicines:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Medicine'
 *         instructions:
 *           type: string
 *     PatientProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           type: string
 *           description: Auth user reference ID
 *         name:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         bloodGroup:
 *           type: string
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             zipCode:
 *               type: string
 *         emergencyContact:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             relationship:
 *               type: string
 *             phone:
 *               type: string
 *         medicalHistory:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MedicalHistory'
 *         reports:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Report'
 *         appointments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AppointmentHistory'
 *         prescriptions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PrescriptionHistory'
 */

/**
 * @swagger
 * /api/v1/patients/register:
 *   post:
 *     summary: Register a new patient
 *     tags: [Patients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               mobile:
 *                 type: string
 *               password:
 *                 type: string
 *                 minimum: 6
 *               name:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               symptoms:
 *                 type: string
 *               bloodGroup:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               emergencyContact:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   relationship:
 *                     type: string
 *                   phone:
 *                     type: string
 *     responses:
 *       201:
 *         description: Patient successfully registered
 *       400:
 *         description: Validation error
 */
router.post('/register', cloudinaryUpload.any(), patientValidation.registerValidation, patientController.register);
router.post('/verify-otp', patientController.verifyOtp);
router.post('/forgot-password', patientController.forgotPassword);
router.post('/reset-password', patientController.resetPassword);

/**
 * @swagger
 * /api/v1/patients/login:
 *   post:
 *     summary: Patient Login
 *     tags: [Patients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: User is not a patient
 */
router.post('/login', patientController.login);

/**
 * @swagger
 * /api/v1/patients/profile:
 *   get:
 *     summary: Get logged-in patient profile (Self)
 *     tags: [Patients]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update patient profile (Self)
 *     tags: [Patients]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               symptoms:
 *                 type: string
 *               bloodGroup:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *               address:
 *                 type: object
 *               emergencyContact:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', protect, patientController.getProfile);
router.put('/profile', protect, authorize('patient'), cloudinaryUpload.single('photo'), patientValidation.profileUpdateValidation, patientController.updateProfile);

/**
 * @swagger
 * /api/v1/patients/profile/{id}:
 *   get:
 *     summary: Get a specific patient profile (Doctor/Admin only)
 *     tags: [Patients]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient document ID
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *       403:
 *         description: Forbidden - Staff only
 */
router.get('/profile/:id', protect, authorize('super_admin', 'hospital_admin', 'doctor', 'receptionist', 'financial_manager', 'pharmacist'), patientController.getProfile);


/**
 * @swagger
 * /api/v1/patients/medical-history:
 *   get:
 *     summary: Get medical history (Self)
 *     tags: [Patients]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Medical history entries
 *   post:
 *     summary: Add medical history entry (Self)
 *     tags: [Patients]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MedicalHistory'
 *     responses:
 *       201:
 *         description: Medical history entry added successfully
 */
router.get('/medical-history', protect, authorize('patient'), patientController.getMedicalHistory);
router.post('/medical-history', protect, authorize('patient'), patientValidation.medicalHistoryValidation, patientController.addMedicalHistory);

/**
 * @swagger
 * /api/v1/patients/medical-history/{id}:
 *   get:
 *     summary: Get a patient's medical history (Doctor/Admin only)
 *     tags: [Patients]
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
 *         description: List of medical history entries
 *   post:
 *     summary: Add medical history entry for a patient (Doctor/Admin only)
 *     tags: [Patients]
 *     security:
 *       - BearerAuth: []
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
 *             $ref: '#/components/schemas/MedicalHistory'
 *     responses:
 *       201:
 *         description: Medical history entry added successfully
 */
router.get('/medical-history/:id', protect, authorize('super_admin', 'hospital_admin', 'doctor'), patientController.getMedicalHistory);
router.post('/medical-history/:id', protect, authorize('super_admin', 'hospital_admin', 'doctor'), patientValidation.medicalHistoryValidation, patientController.addMedicalHistory);

/**
 * @swagger
 * /api/v1/patients/records/me:
 *   get:
 *     summary: Get full consolidated medical records for logged in patient
 *     tags: [Patients]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Full medical records including consultations, prescriptions, reports, and history
 */
router.get('/records/me', protect, authorize('patient'), patientController.getFullMedicalRecords);

/**
 * @swagger
 * /api/v1/patients/records/{id}:
 *   get:
 *     summary: Get full consolidated medical records for a specific patient
 *     tags: [Patients]
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
 *         description: Full medical records
 */
router.get('/records/:id', protect, authorize('super_admin', 'hospital_admin', 'doctor'), patientController.getFullMedicalRecords);

/**
 * @swagger
 * /api/v1/patients/reports/upload:
 *   post:
 *     summary: Upload a medical report file (Patient Self only)
 *     tags: [Patients]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - report
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the report document
 *               report:
 *                 type: string
 *                 format: binary
 *                 description: Report file (PDF, PNG, JPG, JPEG)
 *     responses:
 *       201:
 *         description: Report successfully uploaded
 *       400:
 *         description: File upload or validation error
 */
router.post('/reports/upload', protect, authorize('patient'), uploadHandler, patientController.uploadReport);

/**
 * @swagger
 * /api/v1/patients/appointments:
 *   get:
 *     summary: Get appointment history (Self)
 *     tags: [Patients]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of appointments
 *   post:
 *     summary: Add appointment entry to history (Self)
 *     tags: [Patients]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppointmentHistory'
 *     responses:
 *       201:
 *         description: Appointment entry added
 */
router.get('/appointments', protect, authorize('patient'), patientController.getAppointments);
router.post('/appointments', protect, authorize('patient'), patientValidation.appointmentValidation, patientController.addAppointment);
router.put('/appointments/:id/cancel', protect, authorize('patient'), patientController.cancelAppointment);

/**
 * @swagger
 * /api/v1/patients/appointments/{id}:
 *   get:
 *     summary: Get a specific patient's appointment history (Doctor/Admin only)
 *     tags: [Patients]
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
 *         description: List of appointments
 *   post:
 *     summary: Add appointment entry to a patient's history (Doctor/Admin only)
 *     tags: [Patients]
 *     security:
 *       - BearerAuth: []
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
 *             $ref: '#/components/schemas/AppointmentHistory'
 *     responses:
 *       201:
 *         description: Appointment entry added
 */
router.get('/appointments/:id', protect, authorize('super_admin', 'hospital_admin', 'doctor'), patientController.getAppointments);
router.post('/appointments/:id', protect, authorize('super_admin', 'hospital_admin', 'doctor'), patientValidation.appointmentValidation, patientController.addAppointment);

/**
 * @swagger
 * /api/v1/patients/prescriptions:
 *   get:
 *     summary: Get prescription history (Self)
 *     tags: [Patients]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Prescription history entries
 */
router.get('/prescriptions', protect, authorize('patient'), patientController.getPrescriptions);

/**
 * @swagger
 * /api/v1/patients/prescriptions/{id}:
 *   get:
 *     summary: Get a specific patient's prescription history (Doctor/Admin only)
 *     tags: [Patients]
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
 *         description: List of prescriptions
 *   post:
 *     summary: Create/Add a prescription for a patient (Doctor/Admin only)
 *     tags: [Patients]
 *     security:
 *       - BearerAuth: []
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
 *             $ref: '#/components/schemas/PrescriptionHistory'
 *     responses:
 *       201:
 *         description: Prescription created successfully
 *       403:
 *         description: Forbidden - Doctor/Admin only
 */
router.get('/prescriptions/:id', protect, authorize('super_admin', 'hospital_admin', 'doctor', 'pharmacist'), patientController.getPrescriptions);
router.post('/prescriptions/:id', protect, authorize('super_admin', 'hospital_admin', 'doctor'), patientValidation.prescriptionValidation, patientController.addPrescription);

/**
 * @swagger
 * /api/v1/patients:
 *   get:
 *     summary: Retrieve list of patients (Admin/Billing sees all, Doctor sees assigned)
 *     tags: [Patients]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Search by patient name (first, last, or full name)
 *     responses:
 *       200:
 *         description: List of patients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PatientProfile'
 *       403:
 *         description: Forbidden
 */
router.get('/', protect, authorize('super_admin', 'hospital_admin', 'doctor', 'receptionist', 'financial_manager', 'pharmacist'), patientController.getAllPatients);

/**
 * @swagger
 * /api/v1/patients/manual:
 *   post:
 *     summary: Manually register a walk-in patient (Admin only)
 *     tags: [Patients, Ward]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               mobile:
 *                 type: string
 *               password:
 *                 type: string
 *                 minimum: 6
 *               name:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               symptoms:
 *                 type: string
 *               bloodGroup:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *               address:
 *                 type: object
 *               emergencyContact:
 *                 type: object
 *     responses:
 *       201:
 *         description: Patient successfully registered manually
 *       400:
 *         description: Validation error
 */
router.post('/manual', protect, authorize('super_admin', 'hospital_admin', 'receptionist'), cloudinaryUpload.any(), patientValidation.manualRegisterValidation, patientController.manualRegister);

/**
 * @swagger
 * /api/v1/patients/profile/{id}:
 *   put:
 *     summary: Update a specific patient's profile (Admin/Receptionist only)
 *     tags: [Patients]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Updates patient login email
 *               mobile:
 *                 type: string
 *                 description: Updates patient login mobile number
 *               name:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               symptoms:
 *                 type: string
 *               bloodGroup:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *               address:
 *                 type: object
 *               emergencyContact:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       404:
 *         description: Patient profile not found
 */
router.put('/profile/:id', protect, authorize('super_admin', 'hospital_admin', 'receptionist'), patientValidation.profileUpdateValidation, patientController.updateProfileById);

/**
 * @swagger
 * /api/v1/patients/{id}:
 *   get:
 *     summary: Get a specific patient profile (Doctor/Admin only) - Alias for /profile/{id}
 *     tags: [Patients]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient document ID
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *       403:
 *         description: Forbidden - Staff only
 */
router.get('/:id', protect, authorize('super_admin', 'hospital_admin', 'doctor', 'receptionist', 'financial_manager', 'pharmacist'), patientController.getProfile);

/**
 * @swagger
 * /api/v1/patients/{id}:
 *   delete:
 *     summary: Delete a patient profile and user account (Admin only)
 *     tags: [Patients]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient document ID
 *     responses:
 *       200:
 *         description: Patient successfully deleted
 *       404:
 *         description: Patient profile not found
 */
router.delete('/:id', protect, authorize('super_admin', 'hospital_admin'), patientController.deletePatient);

module.exports = router;
