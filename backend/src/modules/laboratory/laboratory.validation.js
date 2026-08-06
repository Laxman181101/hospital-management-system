const Joi = require('joi');

const createTest = {
    body: Joi.object().keys({
        testName: Joi.string().required(),
        category: Joi.string().valid('Blood', 'Urine', 'X-Ray', 'MRI', 'CT Scan', 'Ultrasound', 'Pathology', 'Other').required(),
        description: Joi.string().allow('', null),
        price: Joi.number().min(0).required(),
        turnaroundTime: Joi.string().allow('', null)
    })
};

const updateTest = {
    params: Joi.object().keys({
        testId: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"testId" must be a valid mongo id');
            return value;
        }).required()
    }),
    body: Joi.object().keys({
        testName: Joi.string(),
        category: Joi.string().valid('Blood', 'Urine', 'X-Ray', 'MRI', 'CT Scan', 'Ultrasound', 'Pathology', 'Other'),
        description: Joi.string().allow('', null),
        price: Joi.number().min(0),
        turnaroundTime: Joi.string().allow('', null)
    }).min(1)
};

const createRequest = {
    body: Joi.object().keys({
        patient: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"patient" must be a valid mongo id');
            return value;
        }).required(),
        doctor: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"doctor" must be a valid mongo id');
            return value;
        }).allow('', null),
        tests: Joi.array().items(
            Joi.string().custom((value, helpers) => {
                if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('each test must be a valid mongo id');
                return value;
            })
        ).min(1).required(),
        paymentStatus: Joi.string().valid('Unpaid', 'Paid')
    })
};

const updateTestStatus = {
    params: Joi.object().keys({
        requestId: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"requestId" must be a valid mongo id');
            return value;
        }).required(),
        testItemId: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"testItemId" must be a valid mongo id');
            return value;
        }).required()
    }),
    body: Joi.object().keys({
        status: Joi.string().valid('Pending', 'Sample Collected', 'Completed', 'Cancelled').required(),
        resultNotes: Joi.string().allow('', null)
    })
};

module.exports = {
    createTest,
    updateTest,
    createRequest,
    updateTestStatus
};
