const express = require('express');
const cors = require('cors');

const path = require('path');

// Import routes
const authRoutes = require('./modules/auth/auth.route');
const patientRoutes = require('./modules/patient/patient.route');
const hospitalRoutes = require('./modules/hospital/hospital.routes');
const doctorRoutes = require('./modules/doctor/doctor.route');
const consultationRoutes = require('./modules/consultation/consultation.route');
const prescriptionRoutes = require('./modules/prescription/prescription.route');
const videoConsultationRoutes = require('./modules/video-consultation/video-consultation.route');
const chatConsultationRoutes = require('./modules/chat-consultation/chat-consultation.route');
const audioConsultationRoutes = require('./modules/audio-consultation/audio-consultation.route');
const notificationRoutes = require('./modules/notification/notification.route');
const setupSwagger = require('./config/swagger');
const appointmentRoutes = require('./modules/appointment/appointment.route');
const dashboardRoutes = require('./modules/dashboard/dashboard.route');
const billingRoutes = require('./modules/billing/billing.route');
const paymentRoutes = require('./modules/payment/payment.route');
const pharmacyRoutes = require('./modules/pharmacy/pharmacy.route');
const laboratoryRoutes = require('./modules/laboratory/laboratory.route');
const wardRoutes = require('./modules/ward/ward.route');
const inventoryRoutes = require('./modules/inventory/inventory.route');
const financeRoutes = require('./modules/finance/finance.route');
const ambulanceRoutes = require('./modules/ambulance/ambulance.route');
const operationTheaterRoutes = require('./modules/operation-theater/operation-theater.route');
const leaveRoutes = require('./modules/staff-leave/leave.route');
const attendanceRoutes = require('./modules/attendance/attendance.route');
const env = require('./config/env');
const { notFoundHandler, globalErrorHandler } = require('./middleware/error.middleware');

const app = express();

// Webhook raw body parser (MUST run before express.json() to verify HMAC signature correctly)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads and receipts folders as static
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/receipts', express.static(path.join(__dirname, '../receipts')));

// Setup Swagger Docs
setupSwagger(app);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/hospitals', hospitalRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/consultations', consultationRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/video-consultations', videoConsultationRoutes);
app.use('/api/v1/chat-consultations', chatConsultationRoutes);
app.use('/api/v1/audio-consultations', audioConsultationRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/v1/pharmacy', pharmacyRoutes);
app.use('/api/v1/laboratory', laboratoryRoutes);
app.use('/api/v1/ward', wardRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/ambulances', ambulanceRoutes);
app.use('/api/v1/operation-theaters', operationTheaterRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/attendance', attendanceRoutes);

// Base route for health check
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the HMS API' });
});

// 404 Route Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
