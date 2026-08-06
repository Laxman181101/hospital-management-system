const Joi = require('joi');

const createExpense = {
    body: Joi.object().keys({
        expenseName: Joi.string().required(),
        category: Joi.string().valid('Utility Bill', 'Maintenance', 'Equipment Purchase', 'Medicine Purchase', 'Marketing', 'Miscellaneous', 'Other').required(),
        amount: Joi.number().min(0).required(),
        dateIncurred: Joi.date().iso().allow('', null),
        description: Joi.string().allow('', null)
    })
};

const createPayroll = {
    body: Joi.object().keys({
        staff: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"staff" must be a valid mongo id');
            return value;
        }).required(),
        salaryMonth: Joi.string().pattern(/^\d{4}-\d{2}$/).required().messages({
            'string.pattern.base': '"salaryMonth" must be in YYYY-MM format'
        }),
        basicSalary: Joi.number().min(0).required(),
        bonus: Joi.number().min(0).allow(null),
        deductions: Joi.number().min(0).allow(null),
        status: Joi.string().valid('Pending', 'Paid')
    })
};

const updatePayrollStatus = {
    params: Joi.object().keys({
        payrollId: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"payrollId" must be a valid mongo id');
            return value;
        }).required()
    }),
    body: Joi.object().keys({
        status: Joi.string().valid('Pending', 'Paid').required()
    })
};

module.exports = {
    createExpense,
    createPayroll,
    updatePayrollStatus
};
