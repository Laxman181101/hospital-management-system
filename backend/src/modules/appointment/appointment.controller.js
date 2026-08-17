const Appointment = require('./appointment.model');
const Patient = require('../patient/patient.model');
const Doctor = require('../doctor/doctor.model');
const Payment = require('../payment/payment.model');
const Razorpay = require('razorpay');
const env = require('../../config/env');

const appointmentService = require("./appointment.service");
const {
  createAppointmentValidation,
  updateAppointmentStatusValidation,
  rescheduleAppointmentValidation,
  updatePaymentStatusValidation,
} = require("./appointment.validation");

const keyId = env.razorpayKeyId || process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY || 'rzp_test_placeholder';
const keySecret = env.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || 'placeholder_secret';

const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
});

// Book Appointment (HEAD version - local)
const bookAppointment = async (req, res) => {
    const { doctorId, date, timeSlot, notes } = req.body;
    try {
        // 1. Get patient profile
        const patient = await Patient.findOne({ user: req.user.sub });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found. Please create a patient profile first.' });
        }

        // 2. Get doctor details
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        // 3. Create the appointment in 'pending_payment' status
        const appointment = new Appointment({
            patient: patient._id,
            patientModel: 'Patient',
            doctor: doctor._id,
            hospital: doctor.hospital,
            date: new Date(date),
            timeSlot,
            slot: timeSlot, // set the required 'slot' field
            status: 'pending_payment',
            notes,
            consultationFee: doctor.consultationFee,
            paymentStatus: 'pending'
        });

        // 4. Create Razorpay order
        const amountInPaisa = doctor.consultationFee * 100;
        const options = {
            amount: amountInPaisa,
            currency: 'INR',
            receipt: appointment._id.toString()
        };

        let razorpayOrder;
        try {
            razorpayOrder = await razorpay.orders.create(options);
        } catch (razorError) {
            console.error("Razorpay order creation failed:", razorError.message);
            return res.status(500).json({ 
                message: 'Failed to create payment order with Razorpay. Please check credentials and connection.',
                error: razorError.message 
            });
        }

        // Save order ID to appointment
        appointment.razorpayOrderId = razorpayOrder.id;
        await appointment.save();

        // 5. Create corresponding payment record
        const payment = new Payment({
            appointment: appointment._id,
            patient: patient._id,
            amount: doctor.consultationFee,
            status: 'pending',
            razorpayOrderId: razorpayOrder.id
        });

        await payment.save();

        res.status(201).json({
            message: 'Appointment booked successfully. Order generated.',
            appointment,
            payment,
            razorpayOrder: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                key_id: env.razorpayKeyId
            }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get Patient's Appointments (HEAD version - local)
const getPatientAppointments = async (req, res) => {
    try {
        const patient = await Patient.findOne({ user: req.user.sub });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const appointments = await Appointment.find({ patient: patient._id })
            .populate('doctor', 'name specialization consultationFee')
            .populate('hospital', 'name address city')
            .sort({ date: -1 });

        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Specific Appointment Details (HEAD version - local)
const getAppointmentById = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('patient', 'name firstName lastName gender dateOfBirth')
            .populate('doctor', 'name specialization consultationFee')
            .populate('hospital', 'name address city');

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Access control check: super_admin, hospital_admin, assigned doctor, or the patient who booked it
        const isStaff = ['super_admin', 'hospital_admin'].includes(req.user.role);
        
        let isAuthorized = isStaff;

        if (!isAuthorized && req.user.role === 'doctor') {
            const doctor = await Doctor.findOne({ user: req.user.sub });
            if (doctor && appointment.doctor.equals(doctor._id)) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized && req.user.role === 'patient') {
            const patient = await Patient.findOne({ user: req.user.sub });
            if (patient && appointment.patient.equals(patient._id)) {
                isAuthorized = true;
            }
        }

        // Allow access if patientModel is 'Auth' and req.user.sub matches patient ID
        if (!isAuthorized && appointment.patientModel === 'Auth' && appointment.patient.equals(req.user.sub)) {
            isAuthorized = true;
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to view this appointment' });
        }

        res.status(200).json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// CREATE APPOINTMENT (laxman version)
const createAppointment = async (req, res, next) => {
    try {
        const { error } = createAppointmentValidation.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const payload = {
            ...req.body,
            patient: req.body.patient || req.user.sub,
            patientModel: req.body.patient ? 'Patient' : 'Auth'
        };

        const appointment = await appointmentService.createAppointment(payload);

        res.status(201).json({
            success: true,
            message: "Appointment booked successfully",
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
};

// GET MY APPOINTMENTS (laxman version)
const getMyAppointments = async (req, res, next) => {
    try {
        const appointments = await appointmentService.getMyAppointments(req.user.sub);
        res.status(200).json({
            success: true,
            data: appointments,
        });
    } catch (error) {
        next(error);
    }
};

// GET DOCTOR APPOINTMENTS (laxman version)
const getDoctorAppointments = async (req, res, next) => {
    try {
        const appointments = await appointmentService.getDoctorAppointments(req.user.sub, req.query);
        res.status(200).json({
            success: true,
            data: appointments,
        });
    } catch (error) {
        next(error);
    }
};

// CANCEL APPOINTMENT (laxman version)
const cancelAppointment = async (req, res, next) => {
    try {
        const appointment = await appointmentService.cancelAppointment(
            req.params.id,
            req.user.sub,
            req.user.role
        );

        res.status(200).json({
            success: true,
            message: "Appointment cancelled",
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
};

// UPDATE STATUS (laxman version)
const updateAppointmentStatus = async (req, res, next) => {
    try {
        const { error } = updateAppointmentStatusValidation.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const appointment = await appointmentService.updateAppointmentStatus(
            req.params.id,
            req.body.status,
            req.user.sub,
            req.user.role
        );

        res.status(200).json({
            success: true,
            message: "Status updated",
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
};

// GET AVAILABLE SLOTS
const getAvailableSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ success: false, message: "doctorId and date are required" });
    }
    const slots = await appointmentService.getAvailableSlots(doctorId, date);
    res.status(200).json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

// GET ALL APPOINTMENTS
const getAllAppointments = async (req, res, next) => {
  try {
    const appointments = await appointmentService.getAllAppointments(req.query, req.user);
    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
};

// RESCHEDULE APPOINTMENT
const rescheduleAppointment = async (req, res, next) => {
  try {
    const { error } = rescheduleAppointmentValidation.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const appointment = await appointmentService.rescheduleAppointment(
      req.params.id, req.body, req.user.sub, req.user.role
    );
    res.status(200).json({ success: true, message: "Appointment rescheduled", data: appointment });
  } catch (error) {
    next(error);
  }
};

// UPDATE PAYMENT STATUS
const updatePaymentStatus = async (req, res, next) => {
  try {
    const { error } = updatePaymentStatusValidation.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const appointment = await appointmentService.updatePaymentStatus(
      req.params.id, req.body.status, req.user.role, req.body.paymentMethod
    );
    res.status(200).json({ success: true, message: "Payment status updated", data: appointment });
  } catch (error) {
    next(error);
  }
};

// DELETE APPOINTMENT
const deleteAppointment = async (req, res, next) => {
  try {
    await appointmentService.deleteAppointment(req.params.id, req.user.role);
    res.status(200).json({ success: true, message: "Appointment deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookAppointment,
  getPatientAppointments,
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  cancelAppointment,
  updateAppointmentStatus,
  getAvailableSlots,
  getAllAppointments,
  getAppointmentById,
  rescheduleAppointment,
  updatePaymentStatus,
  deleteAppointment,
};
