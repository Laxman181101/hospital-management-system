const Joi = require('joi');

const createOTSchema = Joi.object({
    name: Joi.string().required().trim(),
    type: Joi.string().valid('General', 'Cardiac', 'Ortho', 'Gynae', 'ENT', 'Other').required(),
    capacity: Joi.number().integer().min(1).optional(),
    description: Joi.string().trim().optional(),
    status: Joi.string().valid('Available', 'Occupied', 'Maintenance', 'Cleaning').optional()
});

const updateOTSchema = Joi.object({
    name: Joi.string().trim().optional(),
    type: Joi.string().valid('General', 'Cardiac', 'Ortho', 'Gynae', 'ENT', 'Other').optional(),
    capacity: Joi.number().integer().min(1).optional(),
    description: Joi.string().trim().optional(),
    status: Joi.string().valid('Available', 'Occupied', 'Maintenance', 'Cleaning').optional()
});

const scheduleSurgerySchema = Joi.object({
    patientId: Joi.string().hex().length(24).required(),
    admissionId: Joi.string().hex().length(24).optional(),
    operationTheaterId: Joi.string().hex().length(24).required(),
    surgeonId: Joi.string().hex().length(24).required(),
    anesthetistId: Joi.string().hex().length(24).optional(),
    surgeryName: Joi.string().required().trim(),
    scheduledDate: Joi.date().iso().required(),
    startTime: Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
        'string.pattern.base': 'startTime must be in HH:mm format'
    }),
    endTime: Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
        'string.pattern.base': 'endTime must be in HH:mm format'
    }),
    preOpNotes: Joi.string().optional()
});

const requestSurgerySchema = Joi.object({
    patientId: Joi.string().hex().length(24).required(),
    admissionId: Joi.string().hex().length(24).optional(),
    surgeonId: Joi.string().hex().length(24).required(),
    surgeryName: Joi.string().required().trim(),
    scheduledDate: Joi.date().iso().required(),
    preOpNotes: Joi.string().optional()
});

const approveSurgerySchema = Joi.object({
    operationTheaterId: Joi.string().hex().length(24).required(),
    anesthetistId: Joi.string().hex().length(24).optional(),
    scheduledDate: Joi.date().iso().required(),
    startTime: Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
        'string.pattern.base': 'startTime must be in HH:mm format'
    }),
    endTime: Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
        'string.pattern.base': 'endTime must be in HH:mm format'
    })
});

const updateSurgeryStatusSchema = Joi.object({
    status: Joi.string().valid('Scheduled', 'In-Progress', 'Recovery', 'Completed', 'Cancelled').required(),
    postOpNotes: Joi.string().optional(),
    otRoomCharge: Joi.number().min(0).optional(),
    surgeonFee: Joi.number().min(0).optional(),
    anesthetistFee: Joi.number().min(0).optional(),
    consumableCharges: Joi.number().min(0).optional()
});

const rescheduleSurgerySchema = Joi.object({
    scheduledDate: Joi.date().iso().required(),
    startTime: Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
        'string.pattern.base': 'startTime must be in HH:mm format'
    }),
    endTime: Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
        'string.pattern.base': 'endTime must be in HH:mm format'
    }),
    operationTheaterId: Joi.string().hex().length(24).optional()
});

module.exports = {
    createOTSchema,
    updateOTSchema,
    scheduleSurgerySchema,
    requestSurgerySchema,
    approveSurgerySchema,
    updateSurgeryStatusSchema,
    rescheduleSurgerySchema
};
