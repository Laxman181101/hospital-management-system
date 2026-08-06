const Joi = require('joi');

const billingItemValidation = Joi.object({
    description: Joi.string().required().messages({
        'any.required': 'Item description is required',
        'string.empty': 'Item description cannot be empty'
    }),
    amount: Joi.number().min(0).required().messages({
        'any.required': 'Item amount is required',
        'number.min': 'Item amount cannot be negative'
    }),
    quantity: Joi.number().integer().min(1).default(1).optional()
});

const createBillingValidation = Joi.object({
    patient: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
        'any.required': 'Patient ID is required',
        'string.empty': 'Patient ID cannot be empty',
        'string.pattern.base': 'Patient ID must be a valid 24-character hexadecimal MongoDB ObjectId'
    }),
    appointment: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(''),
    prescription: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(''),
    module: Joi.string().optional(),
    referenceId: Joi.string().optional(),
    items: Joi.array().items(billingItemValidation).min(1).required().messages({
        'any.required': 'At least one billing item is required',
        'array.min': 'At least one billing item is required'
    }),
    discount: Joi.number().min(0).default(0).optional(),
    tax: Joi.number().min(0).default(0).optional(),
    paymentMethod: Joi.string().valid('cash', 'card', 'upi', 'net_banking', 'insurance').default('cash').optional(),
    paymentStatus: Joi.string().valid('unpaid', 'partially_paid', 'paid', 'refunded').default('unpaid').optional()
}).unknown(true);

const updatePaymentValidation = Joi.object({
    paymentStatus: Joi.string().valid('unpaid', 'partially_paid', 'paid', 'refunded').required().messages({
        'any.required': 'Payment status is required'
    }),
    paymentMethod: Joi.string().valid('cash', 'card', 'upi', 'net_banking', 'insurance').optional(),
    discount: Joi.number().min(0).optional()
});

module.exports = {
    createBillingValidation,
    updatePaymentValidation
};
