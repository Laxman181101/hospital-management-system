const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');


const router = express.Router();

const {
  createHospital,
  getHospital,
  getHospitalById,
  getHospitals,
  updateHospital,
  deleteHospital,
  searchHospitals,
  getNearbyHospitals,
  getHospitalDoctors,
  uploadLogo,
  uploadImages,
  removeImage,
  toggleHospitalStatus,
  addHospitalService,
  removeHospitalService,
  addHospitalReview,
  getHospitalReviews,
  setLocation,
  onboardHospital,
} = require('./hospital.controller');

const upload = require('../../middleware/upload.middleware');

// Middleware helper to handle multer errors
const uploadLogoHandler = (req, res, next) => {
  upload.single('logo')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

const uploadImagesHandler = (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

const uploadDocHandler = (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

/**
 * @swagger
 * tags:
 *   name: Hospitals
 *   description: Hospital management APIs
 */

/**
 * @swagger
 * /api/v1/hospitals/onboard:
 *   post:
 *     summary: Public Hospital Onboarding (Self-Registration)
 *     description: Register a new hospital along with its admin account. The admin account will be created as pending until a super admin approves it. No JWT token required.
 *     tags: [Hospitals]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - hospitalName
 *               - hospitalAddress
 *               - hospitalCity
 *               - hospitalContactNumber
 *               - licenseNumber
 *               - document
 *               - adminFirstName
 *               - adminEmail
 *               - adminMobile
 *               - adminPassword
 *             properties:
 *               hospitalName:
 *                 type: string
 *               hospitalAddress:
 *                 type: string
 *               hospitalCity:
 *                 type: string
 *               hospitalContactNumber:
 *                 type: string
 *               hospitalEmail:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *               document:
 *                 type: string
 *                 format: binary
 *               adminFirstName:
 *                 type: string
 *               adminLastName:
 *                 type: string
 *               adminEmail:
 *                 type: string
 *               adminMobile:
 *                 type: string
 *               adminPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: Hospital and Admin registered successfully (Pending Approval)
 *       400:
 *         description: Bad Request
 */
router.post('/onboard', uploadDocHandler, onboardHospital);

/**
 * @swagger
 * /api/v1/hospitals/create:
 *   post:
 *     summary: Create a new hospital (Admin Only)
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hospitalName
 *               - description
 *               - address
 *               - location
 *               - phone
 *               - email
 *             properties:
 *               hospitalName:
 *                 type: string
 *                 example: City General Hospital
 *               description:
 *                 type: string
 *                 example: A premier multi-specialty healthcare facility.
 *               address:
 *                 type: object
 *                 required:
 *                   - street
 *                   - area
 *                   - city
 *                   - state
 *                   - pincode
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: 123 Health Ave
 *                   area:
 *                     type: string
 *                     example: Bandra West
 *                   city:
 *                     type: string
 *                     example: Mumbai
 *                   state:
 *                     type: string
 *                     example: Maharashtra
 *                   country:
 *                     type: string
 *                     default: India
 *                     example: India
 *                   pincode:
 *                     type: string
 *                     example: "400050"
 *               location:
 *                 type: object
 *                 required:
 *                   - latitude
 *                   - longitude
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: 19.0596
 *                   longitude:
 *                     type: number
 *                     example: 72.8295
 *               phone:
 *                 type: string
 *                 example: "+91-9876543210"
 *               emergencyNumber:
 *                 type: string
 *                 example: "+91-9876543211"
 *               email:
 *                 type: string
 *                 example: contact@cityhospital.com
 *               services:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - title
 *                     - description
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: Cardiology
 *                     description:
 *                       type: string
 *                       example: High-end cardiac care and operations.
 *     responses:
 *       201:
 *         description: Hospital created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an admin)
 */
router.post('/create', protect, authorize('super_admin', 'hospital_admin'), createHospital);

/**
 * @swagger
 * /api/v1/hospitals:
 *   get:
 *     summary: Get all hospitals (Role filtered for Admin)
 *     tags: [Hospitals]
 *     responses:
 *       200:
 *         description: List of hospitals
 */
router.get('/', protect, getHospitals);

/**
 * @swagger
 * /api/v1/hospitals/active:
 *   get:
 *     summary: Get details of the active hospital
 *     tags: [Hospitals]
 *     responses:
 *       200:
 *         description: Hospital details retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/active', getHospital);

/**
 * @swagger
 * /api/v1/hospitals/search:
 *   get:
 *     summary: Search and filter hospitals
 *     tags: [Hospitals]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: General text search on name, city, state, pincode, or services
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by state
 *       - in: query
 *         name: service
 *         schema:
 *           type: string
 *         description: Filter by service title
 *     responses:
 *       200:
 *         description: List of hospitals matching criteria
 */
router.get('/search', searchHospitals);

/**
 * @swagger
 * /api/v1/hospitals/nearby:
 *   get:
 *     summary: Find nearby hospitals sorted by physical distance
 *     tags: [Hospitals]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: User latitude
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: User longitude
 *       - in: query
 *         name: maxDistanceKm
 *         schema:
 *           type: number
 *           default: 50
 *         description: Search radius in kilometers
 *     responses:
 *       200:
 *         description: Sorted list of nearby hospitals
 *       400:
 *         description: Missing coordinates
 */
router.get('/nearby', getNearbyHospitals);

/**
 * @swagger
 * /api/v1/hospitals/{id}/doctors:
 *   get:
 *     summary: Get all doctors practicing in a specific hospital
 *     tags: [Hospitals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hospital ID
 *     responses:
 *       200:
 *         description: List of doctors
 */
router.get('/:id/doctors', getHospitalDoctors);

/**
 * @swagger
 * /api/v1/hospitals/{id}/upload-logo:
 *   post:
 *     summary: Upload hospital logo image (Admin Only)
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hospital ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - logo
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Logo image file (JPEG, JPG, PNG)
 *     responses:
 *       200:
 *         description: Logo uploaded successfully
 *       400:
 *         description: File upload error
 *       404:
 *         description: Hospital not found
 */
router.post(
  '/:id/upload-logo',
  protect,
  authorize('super_admin', 'hospital_admin'),
  uploadLogoHandler,
  uploadLogo
);

/**
 * @swagger
 * /api/v1/hospitals/{id}/upload-images:
 *   post:
 *     summary: Upload hospital infrastructure images (Admin Only)
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hospital ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Infrastructure images (JPEG, JPG, PNG, Max 10)
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       400:
 *         description: File upload error
 *       404:
 *         description: Hospital not found
 */
router.post(
  '/:id/upload-images',
  protect,
  authorize('super_admin', 'hospital_admin'),
  uploadImagesHandler,
  uploadImages
);

/**
 * @swagger
 * /api/v1/hospitals/{id}/remove-image:
 *   delete:
 *     summary: Remove hospital infrastructure image (Admin Only)
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hospital ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Image removed successfully
 *       404:
 *         description: Hospital not found
 */
router.delete(
  '/:id/remove-image',
  protect,
  authorize('super_admin', 'hospital_admin'),
  removeImage
);

/**
 * @swagger
 * /api/v1/hospitals/{id}/status:
 *   patch:
 *     summary: Toggle hospital active/inactive status (Admin Only)
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hospital ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Status toggled successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Hospital not found
 */
router.patch(
  '/:id/status',
  protect,
  authorize('super_admin', 'hospital_admin'),
  toggleHospitalStatus
);

/**
 * @swagger
 * /api/v1/hospitals/{id}/services:
 *   post:
 *     summary: Add a new service to hospital (Admin Only)
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hospital ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: Orthopedics
 *               description:
 *                 type: string
 *                 example: Specialized bone and joint treatments.
 *     responses:
 *       200:
 *         description: Service added successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Hospital not found
 */
router.post(
  '/:id/services',
  protect,
  authorize('super_admin', 'hospital_admin'),
  addHospitalService
);

/**
 * @swagger
 * /api/v1/hospitals/{id}/services/{serviceId}:
 *   delete:
 *     summary: Remove a service from hospital (Admin Only)
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hospital ID
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID to remove
 *     responses:
 *       200:
 *         description: Service removed successfully
 *       404:
 *         description: Hospital not found
 */
router.delete(
  '/:id/services/:serviceId',
  protect,
  authorize('super_admin', 'hospital_admin'),
  removeHospitalService
);

/**
 * @swagger
 * /api/v1/hospitals/{id}/reviews:
 *   post:
 *     summary: Add a review and rating for a hospital (Patient Only)
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hospital ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: Great doctors and excellent hygiene.
 *     responses:
 *       201:
 *         description: Review added successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Hospital not found
 *   get:
 *     summary: Get all reviews for a hospital
 *     tags: [Hospitals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hospital ID
 *     responses:
 *       200:
 *         description: List of reviews populated with patient info
 */
router.post('/:id/reviews', protect, authorize('patient'), addHospitalReview);
router.get('/:id/reviews', getHospitalReviews);

/**
 * @swagger
 * /api/v1/hospitals/location/{id}:
 *   patch:
 *     summary: Set/Update hospital coordinates (Admin Only)
 *     description: Update geographic coordinates (latitude and longitude) of a hospital. Requires a JWT token.
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The hospital ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 19.0760
 *               longitude:
 *                 type: number
 *                 example: 72.8777
 *     responses:
 *       200:
 *         description: Hospital coordinates updated successfully
 *       400:
 *         description: Bad Request (Missing coordinates)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hospital not found
 */
router.patch(
  '/location/:id',
  protect,
  authorize('super_admin', 'hospital_admin'),
  setLocation
);

/**
 * @swagger
 * /api/v1/hospitals/{id}:
 *   get:
 *     summary: Get hospital by ID
 *     tags: [Hospitals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hospital details retrieved successfully
 *       404:
 *         description: Hospital not found
 */
router.get('/:id', getHospitalById);

/**
 * @swagger
 * /api/v1/hospitals/{id}:
 *   put:
 *     summary: Update hospital details (Admin Only)
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The hospital ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hospitalName:
 *                 type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: object
 *               location:
 *                 type: object
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               emergencyNumber:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Hospital updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Hospital not found
 */
router.put('/:id', protect, authorize('super_admin', 'hospital_admin'), updateHospital);

/**
 * @swagger
 * /api/v1/hospitals/{id}:
 *   delete:
 *     summary: Delete a hospital (Admin Only)
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The hospital ID
 *     responses:
 *       200:
 *         description: Hospital deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Hospital not found
 */
router.delete('/:id', protect, authorize('super_admin', 'hospital_admin'), deleteHospital);

module.exports = router;