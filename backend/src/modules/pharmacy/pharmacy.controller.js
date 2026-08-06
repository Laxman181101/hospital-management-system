const pharmacyService = require('./pharmacy.service');
const validation = require('./pharmacy.validation');

// Medicine Inventory Controllers
const addMedicine = async (req, res, next) => {
    try {
        const { error } = validation.createMedicine.body.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const hospitalId = req.user.hospitalId;
        if (!hospitalId) {
            return res.status(400).json({ success: false, message: 'Pharmacist must belong to a hospital' });
        }

        const medicine = await pharmacyService.addMedicine(hospitalId, req.body);

        res.status(201).json({
            success: true,
            message: 'Medicine added to inventory successfully',
            data: medicine
        });
    } catch (error) {
        next(error);
    }
};

const getMedicines = async (req, res, next) => {
    try {
        const hospitalId = req.user.hospitalId || req.query.hospitalId; // Allows super_admin or patient to query specific hospital if needed
        if (!hospitalId && req.user.role !== 'super_admin') {
             return res.status(400).json({ success: false, message: 'Hospital ID is required' });
        }

        const medicines = await pharmacyService.getMedicines(hospitalId, req.query);

        res.status(200).json({
            success: true,
            data: medicines
        });
    } catch (error) {
        next(error);
    }
};

const updateMedicine = async (req, res, next) => {
    try {
        const { error: paramsError } = validation.updateMedicine.params.validate(req.params);
        if (paramsError) return res.status(400).json({ success: false, message: paramsError.details[0].message });

        const { error: bodyError } = validation.updateMedicine.body.validate(req.body);
        if (bodyError) return res.status(400).json({ success: false, message: bodyError.details[0].message });

        const hospitalId = req.user.hospitalId;
        const medicine = await pharmacyService.updateMedicine(hospitalId, req.params.medicineId, req.body);

        res.status(200).json({
            success: true,
            message: 'Medicine updated successfully',
            data: medicine
        });
    } catch (error) {
        next(error);
    }
};

// Pharmacy Order Controllers
const createOrder = async (req, res, next) => {
    try {
        const { error } = validation.createOrder.body.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const hospitalId = req.user.hospitalId;
        if (!hospitalId) {
            return res.status(400).json({ success: false, message: 'Pharmacist must belong to a hospital' });
        }

        const order = await pharmacyService.createOrder(hospitalId, req.user.sub, req.body);

        res.status(201).json({
            success: true,
            message: 'Pharmacy order created successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

const getOrders = async (req, res, next) => {
    try {
        const hospitalId = req.user.hospitalId;
        const orders = await pharmacyService.getOrders(hospitalId, req.query, req.user.sub, req.user.role);

        res.status(200).json({
            success: true,
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

const updateOrderStatus = async (req, res, next) => {
    try {
        const { error: paramsError } = validation.updateOrderStatus.params.validate(req.params);
        if (paramsError) return res.status(400).json({ success: false, message: paramsError.details[0].message });

        const { error: bodyError } = validation.updateOrderStatus.body.validate(req.body);
        if (bodyError) return res.status(400).json({ success: false, message: bodyError.details[0].message });

        const hospitalId = req.user.hospitalId;
        const order = await pharmacyService.updateOrderStatus(hospitalId, req.params.orderId, req.body.status);

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addMedicine,
    getMedicines,
    updateMedicine,
    createOrder,
    getOrders,
    updateOrderStatus
};
