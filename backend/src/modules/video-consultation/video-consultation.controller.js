const videoService = require('./video-consultation.service');
const Doctor = require('../doctor/doctor.model');

const getDoctorId = async (userId) => {
    const doctor = await Doctor.findOne({ user: userId });
    if (!doctor) throw new Error('Doctor profile not found');
    return doctor._id;
};

// 1. Create
const create = async (req, res) => {
    try {
        let doctorId;
        let patientId = req.body.patientId;

        if (req.user.role === 'doctor') {
            doctorId = await getDoctorId((req.user.sub || req.user.id));
        } else if (req.user.role === 'patient') {
            doctorId = req.body.doctorId;
            if (!doctorId && req.body.appointmentId) {
                const Appointment = require('../appointment/appointment.model');
                const appt = await Appointment.findById(req.body.appointmentId);
                if (appt) doctorId = appt.doctor;
            }
            const Patient = require('../patient/patient.model');
            const patient = await Patient.findOne({ user: (req.user.sub || req.user.id) });
            if (patient) patientId = patient._id;
        }

        if (!doctorId) {
            return res.status(400).json({ message: 'Doctor ID is required' });
        }

        const VideoConsultation = require('./video-consultation.model');
        if (req.body.appointmentId) {
             const existing = await VideoConsultation.findOne({ appointmentId: req.body.appointmentId });
             if (existing) {
                  return res.status(200).json({ message: 'Video consultation already exists', data: existing });
             }
        }

        const data = { ...req.body, patientId };
        const consultation = await videoService.createVideoConsultation(doctorId, data);
        res.status(201).json({ message: 'Video consultation created successfully', data: consultation });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 2. Get Details
const getDetails = async (req, res) => {
    try {
        const consultation = await videoService.getConsultationById(req.params.id);
        res.status(200).json({ message: 'Consultation details fetched', data: consultation });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// 3. Generate Link
const generateLink = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ message: 'Consultation ID is required' });

        const VideoConsultation = require('./video-consultation.model');
        const existing = await VideoConsultation.findById(id);
        if (!existing) return res.status(404).json({ message: 'Consultation not found' });

        // Ensure user is authorized to generate link
        if (req.user.role === 'doctor') {
            const doctorId = await getDoctorId((req.user.sub || req.user.id));
            if (existing.doctor.toString() !== doctorId.toString()) {
                return res.status(403).json({ message: 'Unauthorized' });
            }
        } else if (req.user.role === 'patient') {
            const Patient = require('../patient/patient.model');
            const patient = await Patient.findOne({ user: (req.user.sub || req.user.id) });
            const patientIdStr = patient ? patient._id.toString() : null;
            const userIdStr = (req.user.sub || req.user.id).toString();
            const existingPatientStr = existing.patient ? existing.patient.toString() : '';

            if (existingPatientStr !== patientIdStr && existingPatientStr !== userIdStr) {
                // One more fallback: check if they own the appointment
                let ownsAppointment = false;
                if (existing.appointmentId) {
                    const Appointment = require('../appointment/appointment.model');
                    const appt = await Appointment.findById(existing.appointmentId);
                    if (appt && (appt.patient.toString() === patientIdStr || appt.patient.toString() === userIdStr)) {
                        ownsAppointment = true;
                    }
                }
                
                if (!ownsAppointment) {
                    return res.status(403).json({ message: 'Unauthorized' });
                }
            }
        }

        if (existing.meetingLink) {
             return res.status(200).json({ message: 'Meeting link already generated', data: existing });
        }

        const crypto = require('crypto');
        const uniqueHash = crypto.randomBytes(6).toString('hex');
        const meetingLink = `https://meet.jit.si/HMS-Video-${uniqueHash}-${Date.now()}`;
        existing.meetingLink = meetingLink;
        await existing.save();

        res.status(200).json({ message: 'Meeting link generated', data: existing });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 4. Join Consultation
const joinConsultation = async (req, res) => {
    try {
        const data = await videoService.joinConsultation(req.params.id);
        res.status(200).json({ message: 'Join meeting', data });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 5. Update Status
const updateStatus = async (req, res) => {
    try {
        const doctorId = await getDoctorId((req.user.sub || req.user.id));
        const consultation = await videoService.updateStatus(req.params.id, doctorId, req.body.status);
        res.status(200).json({ message: 'Status updated', data: consultation });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 6. Get Doctor Appointments
const getDoctorAppointments = async (req, res) => {
    try {
        // ID could be in params (as requested: GET /video-consultations/doctor/{doctorId})
        const { doctorId } = req.params;
        const consultations = await videoService.getDoctorVideoAppointments(doctorId);
        res.status(200).json({ message: 'Doctor video appointments fetched', data: consultations });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    create,
    getDetails,
    generateLink,
    joinConsultation,
    updateStatus,
    getDoctorAppointments
};
