const Joi = require('joi');

const createMedicine = {
    body: Joi.object().keys({
        name: Joi.string().required(),
        category: Joi.string().valid('Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Other').required(),
        manufacturer: Joi.string().allow('', null),
        batchNumber: Joi.string().required(),
        expiryDate: Joi.date().iso().required(),
        unitPrice: Joi.number().min(0).required(),
        stockQuantity: Joi.number().min(0).required()
    })
};

const updateMedicine = {
    params: Joi.object().keys({
        medicineId: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) {
                return helpers.message('"medicineId" must be a valid mongo id');
            }
            return value;
        }).required()
    }),
    body: Joi.object().keys({
        name: Joi.string(),
        category: Joi.string().valid('Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Other'),
        manufacturer: Joi.string().allow('', null),
        batchNumber: Joi.string(),
        expiryDate: Joi.date().iso(),
        unitPrice: Joi.number().min(0),
        stockQuantity: Joi.number().min(0)
    }).min(1)
};

const createOrder = {
    body: Joi.object().keys({
        patient: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"patient" must be a valid mongo id');
            return value;
        }).required(),
        prescription: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"prescription" must be a valid mongo id');
            return value;
        }),
        ipdRound: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"ipdRound" must be a valid mongo id');
            return value;
        }),
        medicines: Joi.array().items(
            Joi.object().keys({
                medicine: Joi.string().custom((value, helpers) => {
                    if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"medicine" must be a valid mongo id');
                    return value;
                }).required(),
                quantity: Joi.number().min(1).required()
            })
        ).min(1).required(),
        status: Joi.string().valid('Pending', 'Dispensed', 'Cancelled'),
        paymentStatus: Joi.string().valid('Paid', 'Unpaid'),
        paymentMethod: Joi.string().valid('Cash', 'Online', 'Card', 'UPI'),
        patientType: Joi.string().valid('OPD', 'IPD')
    })
};

const updateOrderStatus = {
    params: Joi.object().keys({
        orderId: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"orderId" must be a valid mongo id');
            return value;
        }).required()
    }),
    body: Joi.object().keys({
        status: Joi.string().valid('Pending', 'Dispensed', 'Cancelled').required()
    })
};

module.exports = {
    createMedicine,
    updateMedicine,
    createOrder,
    updateOrderStatus
};
