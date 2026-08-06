const Joi = require('joi');

const createWard = {
    body: Joi.object().keys({
        wardName: Joi.string().required(),
        wardType: Joi.string().valid('General', 'ICU', 'Private', 'Semi-Private', 'Maternity', 'Pediatric', 'Emergency', 'Other').required(),
        totalBeds: Joi.number().min(1).required(),
        pricePerDay: Joi.number().min(0).required()
    })
};

const admitPatient = {
    body: Joi.object().keys({
        patient: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"patient" must be a valid mongo id');
            return value;
        }).required(),
        ward: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"ward" must be a valid mongo id');
            return value;
        }).required(),
        bedNumber: Joi.string().required(),
        primaryNurse: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"primaryNurse" must be a valid mongo id');
            return value;
        }).allow('', null),
        admissionRequestId: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"admissionRequestId" must be a valid mongo id');
            return value;
        }).allow('', null),
        doctor: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"doctor" must be a valid mongo id');
            return value;
        }).allow('', null),
        doctorId: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"doctorId" must be a valid mongo id');
            return value;
        }).allow('', null),
        doctorInCharge: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"doctorInCharge" must be a valid mongo id');
            return value;
        }).allow('', null),
        primaryDoctor: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"primaryDoctor" must be a valid mongo id');
            return value;
        }).allow('', null),
        depositAmount: Joi.number().min(0).optional(),
        paymentMethod: Joi.string().valid('cash', 'card', 'upi', 'insurance').optional()
    })
};

const dischargePatient = {
    params: Joi.object().keys({
        allocationId: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"allocationId" must be a valid mongo id');
            return value;
        }).required()
    })
};

const recordVitals = {
    body: Joi.object().keys({
        patient: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"patient" must be a valid mongo id');
            return value;
        }).required(),
        allocation: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"allocation" must be a valid mongo id');
            return value;
        }).required(),
        bloodPressure: Joi.string().allow('', null),
        heartRate: Joi.number().min(0).allow(null),
        temperature: Joi.number().allow(null),
        respiratoryRate: Joi.number().min(0).allow(null),
        oxygenSaturation: Joi.number().min(0).max(100).allow(null),
        notes: Joi.string().allow('', null)
    }).min(3) // Ensure at least patient, allocation and one vital is provided
};

const createAdmissionRequest = {
    body: Joi.object().keys({
        patient: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"patient" must be a valid mongo id');
            return value;
        }).required(),
        consultationId: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"consultationId" must be a valid mongo id');
            return value;
        }).allow('', null),
        priority: Joi.string().valid('Normal', 'Urgent', 'Emergency').default('Normal'),
        reason: Joi.string().required()
    })
};

const createDailyRound = {
    body: Joi.object().keys({
        roundType: Joi.string().valid('Morning', 'Evening', 'Night', 'Emergency').default('Morning'),
        roundDate: Joi.date().iso().optional(),
        chiefComplaints: Joi.string().allow('', null),
        clinicalNotes: Joi.string().allow('', null),
        diagnosis: Joi.string().allow('', null),
        medications: Joi.array().items(
            Joi.object({
                name: Joi.string().required(),
                dose: Joi.string().allow('', null),
                route: Joi.string().valid('Oral', 'IV', 'IM', 'Topical', 'Subcutaneous', 'Inhalation', 'Sublingual', 'Other').default('Oral'),
                frequency: Joi.string().valid('OD', 'BD', 'TDS', 'QID', 'SOS', 'Stat', 'ON', 'Weekly', 'Other').default('OD'),
                duration: Joi.string().allow('', null),
                instructions: Joi.string().allow('', null)
            })
        ).optional(),
        labOrdersRequested: Joi.array().items(Joi.string()).optional(),
        followUpPlan: Joi.string().allow('', null)
    })
};

module.exports = {
    createWard,
    admitPatient,
    dischargePatient,
    recordVitals,
    createAdmissionRequest,
    createDailyRound
};
