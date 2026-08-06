const inventoryService = require('./inventory.service');
const validation = require('./inventory.validation');

// --- Inventory Items Management ---
const createItem = async (req, res, next) => {
    try {
        const { error } = validation.createItem.body.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const item = await inventoryService.createItem(req.user.hospitalId, req.body);
        res.status(201).json({ success: true, message: 'Inventory item added successfully', data: item });
    } catch (error) {
        next(error);
    }
};

const getItems = async (req, res, next) => {
    try {
        const hospitalId = req.user.hospitalId || req.query.hospitalId;
        if (!hospitalId) return res.status(400).json({ success: false, message: 'Hospital ID is required' });

        const items = await inventoryService.getItems(hospitalId, req.query);
        res.status(200).json({ success: true, data: items });
    } catch (error) {
        next(error);
    }
};

const updateItem = async (req, res, next) => {
    try {
        const { error: paramsErr } = validation.updateItem.params.validate(req.params);
        if (paramsErr) return res.status(400).json({ success: false, message: paramsErr.details[0].message });

        const { error: bodyErr } = validation.updateItem.body.validate(req.body);
        if (bodyErr) return res.status(400).json({ success: false, message: bodyErr.details[0].message });

        const item = await inventoryService.updateItem(req.user.hospitalId, req.params.itemId, req.body);
        res.status(200).json({ success: true, message: 'Inventory item updated', data: item });
    } catch (error) {
        next(error);
    }
};

// --- Inventory Transactions ---
const recordTransaction = async (req, res, next) => {
    try {
        const { error } = validation.createTransaction.body.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const transaction = await inventoryService.recordTransaction(req.user.hospitalId, req.user.sub, req.body);
        res.status(201).json({ success: true, message: `Stock ${req.body.transactionType} recorded successfully`, data: transaction });
    } catch (error) {
        next(error);
    }
};

const getTransactions = async (req, res, next) => {
    try {
        const hospitalId = req.user.hospitalId;
        const transactions = await inventoryService.getTransactions(hospitalId, req.query);
        res.status(200).json({ success: true, data: transactions });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createItem,
    getItems,
    updateItem,
    recordTransaction,
    getTransactions
};
