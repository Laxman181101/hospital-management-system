const wardService = require('./ward.service');
const validation = require('./ward.validation');

// --- Admission Requests ---
const createAdmissionRequest = async (req, res, next) => {
    try {
        const { error } = validation.createAdmissionRequest.body.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const request = await wardService.createAdmissionRequest(req.user.hospitalId, req.user.sub, req.body);
        res.status(201).json({ success: true, message: 'Admission request created successfully', data: request });
    } catch (error) {
        next(error);
    }
};

const getAdmissionRequests = async (req, res, next) => {
    try {
        const hospitalId = req.user.hospitalId || req.query.hospitalId;
        if (!hospitalId) return res.status(400).json({ success: false, message: 'Hospital ID is required' });

        const requests = await wardService.getAdmissionRequests(hospitalId, req.query);
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        next(error);
    }
};

const updateAdmissionRequest = async (req, res, next) => {
    try {
        const request = await wardService.updateAdmissionRequest(req.user.hospitalId, req.params.id, req.body);
        res.status(200).json({ success: true, message: 'Admission request updated', data: request });
    } catch (error) {
        next(error);
    }
};

const assignNurse = async (req, res, next) => {
    try {
        const { nurseId } = req.body;
        if (!nurseId) return res.status(400).json({ success: false, message: 'nurseId is required' });
        const allocation = await wardService.assignNurse(req.user.hospitalId, req.params.admissionId, nurseId);
        res.status(200).json({ success: true, message: 'Nurse assigned successfully', data: allocation });
    } catch (error) {
        next(error);
    }
};

// --- Ward Management ---
const createWard = async (req, res, next) => {
    try {
        const { error } = validation.createWard.body.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const ward = await wardService.createWard(req.user.hospitalId, req.body);
        res.status(201).json({ success: true, message: 'Ward created successfully', data: ward });
    } catch (error) {
        next(error);
    }
};

const getWards = async (req, res, next) => {
    try {
        const hospitalId = req.user.hospitalId || req.query.hospitalId;
        if (!hospitalId) return res.status(400).json({ success: false, message: 'Hospital ID is required' });

        const wards = await wardService.getWards(hospitalId);
        res.status(200).json({ success: true, data: wards });
    } catch (error) {
        next(error);
    }
};

// --- Patient Admission ---
const admitPatient = async (req, res, next) => {
    try {
        const { error } = validation.admitPatient.body.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const allocation = await wardService.admitPatient(req.user.hospitalId, req.user.sub, req.body);
        res.status(201).json({ success: true, message: 'Patient admitted successfully', data: allocation });
    } catch (error) {
        next(error);
    }
};

const getAdmissions = async (req, res, next) => {
    try {
        const hospitalId = req.user.hospitalId || req.query.hospitalId;
        if (!hospitalId) return res.status(400).json({ success: false, message: 'Hospital ID is required' });

        // If patient, restrict to their own records
        if (req.user.role === 'patient') {
            req.query.patient = req.user.sub;
        }

        // If doctor, restrict to their own admitted patients
        if (req.user.role === 'doctor') {
            const Doctor = require('../doctor/doctor.model');
            const doctor = await Doctor.findOne({ user: req.user.sub || req.user.id });
            if (doctor) {
                req.query.doctor = doctor._id;
            }
        }

        const admissions = await wardService.getAdmissions(hospitalId, req.query);
        res.status(200).json({ success: true, data: admissions });
    } catch (error) {
        next(error);
    }
};

const dischargePatient = async (req, res, next) => {
    try {
        const { error } = validation.dischargePatient.params.validate(req.params);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const { allocation, draftBill, billingError } = await wardService.dischargePatient(req.user.hospitalId, req.user.sub, req.params.allocationId, req.body);
        const resData = {
            success: true,
            message: 'Patient discharged successfully',
            data: { allocation, draftBill }
        };
        if (billingError) {
            resData.errors = billingError;
        }
        res.status(200).json(resData);
    } catch (error) {
        next(error);
    }
};

const requestDischarge = async (req, res, next) => {
    try {
        const allocation = await wardService.requestDischarge(req.user.hospitalId, req.params.id);
        res.status(200).json({ success: true, message: 'Discharge requested successfully', data: allocation });
    } catch (error) {
        next(error);
    }
};

// --- Patient Vitals ---
const recordVitals = async (req, res, next) => {
    try {
        const { error } = validation.recordVitals.body.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const vitals = await wardService.recordVitals(req.user.hospitalId, req.user.sub, req.body);
        res.status(201).json({ success: true, message: 'Vitals recorded successfully', data: vitals });
    } catch (error) {
        next(error);
    }
};

const getVitals = async (req, res, next) => {
    try {
        const hospitalId = req.user.hospitalId || req.query.hospitalId;
        const vitals = await wardService.getVitals(hospitalId, req.params.allocationId);
        res.status(200).json({ success: true, data: vitals });
    } catch (error) {
        next(error);
    }
};

// --- IPD Daily Rounds ---
const createDailyRound = async (req, res, next) => {
    try {
        const { error } = validation.createDailyRound.body.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const round = await wardService.createDailyRound(
            req.user.hospitalId,
            req.user.sub,
            req.params.allocationId,
            req.body
        );
        res.status(201).json({ success: true, message: 'Daily round saved successfully', data: round });
    } catch (error) {
        next(error);
    }
};

const getDailyRounds = async (req, res, next) => {
    try {
        const hospitalId = req.user.hospitalId || req.query.hospitalId;
        const rounds = await wardService.getDailyRounds(hospitalId, req.params.allocationId);
        res.status(200).json({ success: true, data: rounds });
    } catch (error) {
        next(error);
    }
};

const getDailyRoundById = async (req, res, next) => {
    try {
        const hospitalId = req.user.hospitalId || req.query.hospitalId;
        const round = await wardService.getDailyRoundById(hospitalId, req.params.roundId);
        res.status(200).json({ success: true, data: round });
    } catch (error) {
        next(error);
    }
};

// --- IPD Rounds for Pharmacist ---
const getIpdRoundsForPharmacist = async (req, res, next) => {
    try {
        const hospitalId = req.user.hospitalId || req.query.hospitalId;
        const rounds = await wardService.getIpdRoundsForPharmacist(hospitalId, req.query);
        res.status(200).json({ success: true, data: rounds });
    } catch (error) {
        next(error);
    }
};

const markMedicationsDispensed = async (req, res, next) => {
    try {
        const hospitalId = req.user.hospitalId || req.query.hospitalId;
        const round = await wardService.markMedicationsDispensed(hospitalId, req.user.sub, req.params.roundId);
        res.status(200).json({ success: true, message: 'Medications marked as dispensed to ward', data: round });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createWard,
    getWards,
    createAdmissionRequest,
    getAdmissionRequests,
    updateAdmissionRequest,
    admitPatient,
    getAdmissions,
    dischargePatient,
    requestDischarge,
    assignNurse,
    recordVitals,
    getVitals,
    createDailyRound,
    getDailyRounds,
    getDailyRoundById,
    getIpdRoundsForPharmacist,
    markMedicationsDispensed
};

