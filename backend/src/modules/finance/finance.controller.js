const financeService = require('./finance.service');
const validation = require('./finance.validation');

// --- Expenses ---
const addExpense = async (req, res, next) => {
    try {
        const { error } = validation.createExpense.body.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const expense = await financeService.addExpense(req.user.hospitalId, req.user.sub, req.body);
        res.status(201).json({ success: true, message: 'Expense recorded successfully', data: expense });
    } catch (error) {
        next(error);
    }
};

const getExpenses = async (req, res, next) => {
    try {
        const hospitalId = req.user.hospitalId;
        const expenses = await financeService.getExpenses(hospitalId, req.query);
        res.status(200).json({ success: true, data: expenses });
    } catch (error) {
        next(error);
    }
};

// --- Payroll ---
const createPayroll = async (req, res, next) => {
    try {
        const { error } = validation.createPayroll.body.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const payroll = await financeService.createPayroll(req.user.hospitalId, req.user.sub, req.body);
        res.status(201).json({ success: true, message: 'Payroll created successfully', data: payroll });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Payroll for this staff member for this month already exists.' });
        }
        next(error);
    }
};

const getPayrolls = async (req, res, next) => {
    try {
        const hospitalId = req.user.hospitalId;
        const payrolls = await financeService.getPayrolls(hospitalId, req.query);
        res.status(200).json({ success: true, data: payrolls });
    } catch (error) {
        next(error);
    }
};

const updatePayrollStatus = async (req, res, next) => {
    try {
        const { error: paramsErr } = validation.updatePayrollStatus.params.validate(req.params);
        if (paramsErr) return res.status(400).json({ success: false, message: paramsErr.details[0].message });

        const { error: bodyErr } = validation.updatePayrollStatus.body.validate(req.body);
        if (bodyErr) return res.status(400).json({ success: false, message: bodyErr.details[0].message });

        const payroll = await financeService.updatePayrollStatus(req.user.hospitalId, req.params.payrollId, req.user.sub, req.body.status);
        res.status(200).json({ success: true, message: `Payroll marked as ${req.body.status}`, data: payroll });
    } catch (error) {
        next(error);
    }
};

// --- Financial Overview ---
const getOverview = async (req, res, next) => {
    try {
        const hospitalId = req.user.hospitalId;
        const overview = await financeService.getFinancialOverview(hospitalId, req.query);
        res.status(200).json({ success: true, data: overview });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addExpense,
    getExpenses,
    createPayroll,
    getPayrolls,
    updatePayrollStatus,
    getOverview
};
