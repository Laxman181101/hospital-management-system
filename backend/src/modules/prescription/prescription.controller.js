const prescriptionService = require('./prescription.service');
const Doctor = require('../doctor/doctor.model');
const Patient = require('../patient/patient.model');

// Helper to get document ID from user ID
const getDoctorId = async (userId) => {
    const doctor = await Doctor.findOne({ user: userId });
    if (!doctor) throw new Error('Doctor profile not found');
    return doctor._id;
};

const getPatientId = async (userId) => {
    const patient = await Patient.findOne({ user: userId });
    if (!patient) throw new Error('Patient profile not found');
    return patient._id;
};

const createPrescription = async (req, res) => {
    try {
        const doctorId = await getDoctorId((req.user.sub || req.user.id));
        const prescription = await prescriptionService.createPrescription(doctorId, req.body);
        
        res.status(201).json({
            message: 'Prescription created successfully',
            data: prescription
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updatePrescription = async (req, res) => {
    try {
        const doctorId = await getDoctorId((req.user.sub || req.user.id));
        const { id } = req.params;
        
        const prescription = await prescriptionService.updatePrescription(id, doctorId, req.body);
        
        res.status(200).json({
            message: 'Prescription updated successfully',
            data: prescription
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getPrescriptionById = async (req, res) => {
    try {
        const { id } = req.params;
        const prescription = await prescriptionService.getPrescriptionById(id);
        
        res.status(200).json({
            message: 'Prescription fetched successfully',
            data: prescription
        });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

const getMyPrescriptions = async (req, res) => {
    try {
        const patientId = await getPatientId((req.user.sub || req.user.id));
        const prescriptions = await prescriptionService.getPatientPrescriptions(patientId);
        
        res.status(200).json({
            message: 'Prescriptions fetched successfully',
            data: prescriptions
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getPatientPrescriptionsByDoctor = async (req, res) => {
    try {
        const { patientId } = req.params;
        const prescriptions = await prescriptionService.getPatientPrescriptions(patientId);
        
        res.status(200).json({
            message: 'Patient prescriptions fetched successfully',
            data: prescriptions
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getAllPrescriptions = async (req, res) => {
    try {
        const hospitalId = req.user.hospitalId || req.query.hospitalId; 
        if (!hospitalId) throw new Error('Hospital ID is required');

        const prescriptions = await prescriptionService.getAllPrescriptions(hospitalId);
        
        res.status(200).json({
            message: 'All prescriptions fetched successfully',
            data: prescriptions
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createPrescription,
    updatePrescription,
    getPrescriptionById,
    getMyPrescriptions,
    getPatientPrescriptionsByDoctor,
    getAllPrescriptions
};
