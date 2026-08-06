const Joi = require('joi');

const createItem = {
    body: Joi.object().keys({
        itemName: Joi.string().required(),
        category: Joi.string().valid('Equipment', 'Consumable', 'Blood', 'Furniture', 'Medicine', 'Other').required(),
        bloodGroup: Joi.alternatives().conditional('category', {
            is: 'Blood',
            then: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').required(),
            otherwise: Joi.string().allow('', null)
        }),
        quantity: Joi.number().min(0).required(),
        unit: Joi.string().allow('', null),
        reorderLevel: Joi.number().min(0).allow(null),
        supplier: Joi.string().allow('', null)
    })
};

const updateItem = {
    params: Joi.object().keys({
        itemId: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"itemId" must be a valid mongo id');
            return value;
        }).required()
    }),
    body: Joi.object().keys({
        itemName: Joi.string(),
        reorderLevel: Joi.number().min(0),
        supplier: Joi.string().allow('', null)
    }).min(1)
};

const createTransaction = {
    body: Joi.object().keys({
        item: Joi.string().custom((value, helpers) => {
            if (!value.match(/^[0-9a-fA-F]{24}$/)) return helpers.message('"item" must be a valid mongo id');
            return value;
        }).required(),
        transactionType: Joi.string().valid('In', 'Out').required(),
        quantity: Joi.number().min(1).required(),
        issuedTo: Joi.alternatives().conditional('transactionType', {
            is: 'Out',
            then: Joi.string().required(),
            otherwise: Joi.string().allow('', null)
        }),
        notes: Joi.string().allow('', null)
    })
};

module.exports = {
    createItem,
    updateItem,
    createTransaction
};
