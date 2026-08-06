const express = require(
  "express"
);

const router =
  express.Router();

const appointmentController =
  require(
    "./appointment.controller"
  );

const { protect } = require("../../middleware/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Appointment Management APIs
 */

/**
 * @swagger
 * /api/v1/appointments:
 *   post:
 *     summary: Book a new appointment
 *     description: Patients can book a physical or video appointment with a doctor at a hospital.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctor
 *               - hospital
 *               - appointmentDate
 *               - startTime
 *               - endTime
 *               - appointmentType
 *             properties:
 *               doctor:
 *                 type: string
 *                 description: Doctor ID (Doctor profile ID)
 *                 example: 60c72b2f9b1d8b2bad7c3002
 *               hospital:
 *                 type: string
 *                 description: Hospital ID
 *                 example: 60c72b2f9b1d8b2bad7c3001
 *               appointmentDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date of the appointment
 *                 example: 2026-06-01T00:00:00.000Z
 *               startTime:
 *                 type: string
 *                 description: Start time (e.g. 09:00 AM)
 *                 example: 09:00 AM
 *               endTime:
 *                 type: string
 *                 description: End time (e.g. 09:30 AM)
 *                 example: 09:30 AM
 *               appointmentType:
 *                 type: string
 *                 enum: [physical, video, chat, audio]
 *                 description: Type of appointment
 *                 example: physical
 *               bookingMode:
 *                 type: string
 *                 enum: [online, walk-in]
 *                 description: Mode of booking
 *                 example: online
 *               reason:
 *                 type: string
 *                 description: Reason for booking
 *                 example: Regular checkup
 *               patient:
 *                 type: string
 *                 description: Patient ID (Required if booked by Staff/Admin)
 *                 example: 60c72b2f9b1d8b2bad7c3003
 *     responses:
 *       201:
 *         description: Appointment booked successfully
 *       400:
 *         description: Slot already booked or invalid inputs
 *       401:
 *         description: Unauthorized
 */
// CREATE APPOINTMENT
router.post(
  "/",

  protect,

  appointmentController
    .createAppointment
);

/**
 * @swagger
 * /api/v1/appointments/my:
 *   get:
 *     summary: Get logged-in patient's appointments
 *     description: Retrieve list of appointments booked by the logged-in patient.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (e.g. pending, confirmed)
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (e.g. 2026-06-02)
 *       - in: query
 *         name: bookingMode
 *         schema:
 *           type: string
 *           enum: [online, walk-in]
 *         description: Filter by booking mode (e.g. online, walk-in)
 *     responses:
 *       200:
 *         description: List of patient appointments
 *       401:
 *         description: Unauthorized
 */
// GET MY APPOINTMENTS
router.get(
  "/my",

  protect,

  appointmentController
    .getMyAppointments
);

/**
 * @swagger
 * /api/v1/appointments/doctor:
 *   get:
 *     summary: Get logged-in doctor's appointments
 *     description: Retrieve list of appointments for the logged-in doctor.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (e.g. pending, confirmed)
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (e.g. 2026-06-02)
 *       - in: query
 *         name: bookingMode
 *         schema:
 *           type: string
 *           enum: [online, walk-in]
 *         description: Filter by booking mode (e.g. online, walk-in)
 *     responses:
 *       200:
 *         description: List of doctor appointments
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Doctor profile not found
 */
// GET DOCTOR APPOINTMENTS
router.get(
  "/doctor",

  protect,

  appointmentController
    .getDoctorAppointments
);

/**
 * @swagger
 * /api/v1/appointments/{id}/cancel:
 *   patch:
 *     summary: Cancel an appointment
 *     description: Cancel an appointment by its ID.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The appointment ID
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment not found
 */
// CANCEL APPOINTMENT
router.patch(
  "/:id/cancel",

  protect,

  appointmentController
    .cancelAppointment
);

/**
 * @swagger
 * /api/v1/appointments/{id}/status:
 *   patch:
 *     summary: Update appointment status
 *     description: Update status of an appointment by ID.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, completed, cancelled]
 *                 example: confirmed
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status value
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment not found
 */
// UPDATE STATUS
router.patch(
  "/:id/status",

  protect,

  appointmentController
    .updateAppointmentStatus
);

/**
 * @swagger
 * /api/v1/appointments:
 *   get:
 *     summary: Get all appointments (Admin)
 *     description: Retrieve a list of all appointments. Supports filtering by status, date, and hospital.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: hospital
 *         schema:
 *           type: string
 *       - in: query
 *         name: bookingMode
 *         schema:
 *           type: string
 *           enum: [online, walk-in]
 *         description: Filter by booking mode
 *     responses:
 *       200:
 *         description: List of all appointments
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
// GET ALL APPOINTMENTS
router.get(
  "/",
  protect,
  appointmentController.getAllAppointments
);

/**
 * @swagger
 * /api/v1/appointments/slots:
 *   get:
 *     summary: Get booked slots for a doctor
 *     description: Check which time slots are already booked for a specific doctor on a given date.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of booked slots
 *       400:
 *         description: doctorId and date are required
 */
// GET AVAILABLE SLOTS
router.get(
  "/slots",
  protect,
  appointmentController.getAvailableSlots
);

/**
 * @swagger
 * /api/v1/appointments/{id}:
 *   get:
 *     summary: Get a single appointment by ID
 *     description: Retrieve detailed information for a specific appointment.
 *     tags: [Appointments]
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
 *         description: Appointment details
 *       404:
 *         description: Appointment not found
 */
// GET APPOINTMENT BY ID
router.get(
  "/:id",
  protect,
  appointmentController.getAppointmentById
);

/**
 * @swagger
 * /api/v1/appointments/{id}/reschedule:
 *   patch:
 *     summary: Reschedule an appointment
 *     description: Update the date and time of an existing appointment.
 *     tags: [Appointments]
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
 *             required:
 *               - appointmentDate
 *               - startTime
 *               - endTime
 *             properties:
 *               appointmentDate:
 *                 type: string
 *                 format: date-time
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment rescheduled successfully
 *       400:
 *         description: Slot already booked or invalid inputs
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Appointment not found
 */
// RESCHEDULE APPOINTMENT
router.patch(
  "/:id/reschedule",
  protect,
  appointmentController.rescheduleAppointment
);

/**
 * @swagger
 * /api/v1/appointments/{id}/payment:
 *   patch:
 *     summary: Update payment status
 *     description: Admins or receptionists can mark an appointment as paid.
 *     tags: [Appointments]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, paid]
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Appointment not found
 */
// UPDATE PAYMENT STATUS
router.patch(
  "/:id/payment",
  protect,
  appointmentController.updatePaymentStatus
);

/**
 * @swagger
 * /api/v1/appointments/{id}:
 *   delete:
 *     summary: Delete an appointment
 *     description: Admins can delete an appointment permanently.
 *     tags: [Appointments]
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
 *         description: Appointment deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Appointment not found
 */
// DELETE APPOINTMENT
router.delete(
  "/:id",
  protect,
  appointmentController.deleteAppointment
);

module.exports = router;