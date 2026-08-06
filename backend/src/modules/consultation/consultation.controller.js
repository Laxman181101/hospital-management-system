const consultationService = require('./consultation.service');
const Doctor = require('../doctor/doctor.model');

// Helper to get doctor document ID from authenticated user ID
const getDoctorId = async (userId) => {
    const doctor = await Doctor.findOne({ user: userId });
    if (!doctor) {
        throw new Error('Doctor profile not found for the logged-in user');
    }
    return doctor._id;
};

const createConsultation = async (req, res, next) => {
    try {
        const doctorId = await getDoctorId((req.user.sub || req.user.id));
        const consultationData = req.body;
        
        const consultation = await consultationService.createConsultation(doctorId, consultationData);
        
        res.status(201).json({
            message: 'Consultation created successfully',
            data: consultation
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getDoctorAppointments = async (req, res, next) => {
    try {
        const doctorId = await getDoctorId((req.user.sub || req.user.id));
        const appointments = await consultationService.getDoctorAppointments(doctorId);
        
        res.status(200).json({
            message: 'Doctor appointments fetched successfully',
            data: appointments
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getPatientDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const patient = await consultationService.getPatientDetails(id);
        
        res.status(200).json({
            message: 'Patient details fetched successfully',
            data: patient
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getConsultationById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const consultation = await consultationService.getConsultationById(id);
        
        res.status(200).json({
            message: 'Consultation fetched successfully',
            data: consultation
        });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

const getDoctorConsultations = async (req, res, next) => {
    try {
        const doctorId = await getDoctorId((req.user.sub || req.user.id));
        const consultations = await consultationService.getDoctorConsultations(doctorId);
        
        res.status(200).json({
            message: 'Consultations fetched successfully',
            data: consultations
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const addSymptoms = async (req, res, next) => {
    try {
        const doctorId = await getDoctorId((req.user.sub || req.user.id));
        const { id } = req.params;
        const consultation = await consultationService.addSymptoms(id, doctorId, req.body);
        res.status(200).json({ message: 'Symptoms added successfully', data: consultation });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const addDiagnosis = async (req, res, next) => {
    try {
        const doctorId = await getDoctorId((req.user.sub || req.user.id));
        const { id } = req.params;
        const consultation = await consultationService.addDiagnosis(id, doctorId, req.body);
        res.status(200).json({ message: 'Diagnosis added successfully', data: consultation });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const addNotes = async (req, res, next) => {
    try {
        const doctorId = await getDoctorId((req.user.sub || req.user.id));
        const { id } = req.params;
        const consultation = await consultationService.addClinicalNotes(id, doctorId, req.body);
        res.status(200).json({ message: 'Clinical notes added successfully', data: consultation });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const addFollowup = async (req, res, next) => {
    try {
        const doctorId = await getDoctorId((req.user.sub || req.user.id));
        const { id } = req.params;
        const consultation = await consultationService.addFollowup(id, doctorId, req.body);
        res.status(200).json({ message: 'Follow-up added successfully', data: consultation });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createConsultation,
    getDoctorAppointments,
    getPatientDetails,
    getConsultationById,
    getDoctorConsultations,
    addSymptoms,
    addDiagnosis,
    addNotes,
    addFollowup
};
