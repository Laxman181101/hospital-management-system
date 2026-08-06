const billingService = require('./billing.service');
const { createBillingValidation, updatePaymentValidation } = require('./billing.validation');

const createBilling = async (req, res, next) => {
    try {
        const { error } = createBillingValidation.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        // Must belong to a hospital
        const hospitalId = req.user.hospitalId;
        if (!hospitalId) {
            return res.status(400).json({
                success: false,
                message: 'Staff must belong to a hospital to generate bills'
            });
        }

        const billing = await billingService.createBilling(req.body, req.user.sub, hospitalId);

        res.status(201).json({
            success: true,
            message: 'Billing invoice generated successfully',
            data: billing
        });
    } catch (error) {
        next(error);
    }
};

const getBills = async (req, res, next) => {
    try {
        const bills = await billingService.getBills(
            req.user.sub,
            req.user.role,
            req.user.hospitalId,
            req.query
        );

        res.status(200).json({
            success: true,
            data: bills
        });
    } catch (error) {
        next(error);
    }
};

const getBillById = async (req, res, next) => {
    try {
        const bill = await billingService.getBillById(
            req.params.id,
            req.user.sub,
            req.user.role,
            req.user.hospitalId
        );

        res.status(200).json({
            success: true,
            data: bill
        });
    } catch (error) {
        next(error);
    }
};

const updatePayment = async (req, res, next) => {
    try {
        const { error } = updatePaymentValidation.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const hospitalId = req.user.hospitalId;
        if (!hospitalId) {
            return res.status(400).json({
                success: false,
                message: 'Staff must belong to a hospital to update payments'
            });
        }

        const bill = await billingService.updatePayment(req.params.id, req.body, hospitalId);

        res.status(200).json({
            success: true,
            message: 'Payment status updated successfully',
            data: bill
        });
    } catch (error) {
        next(error);
    }
};

const downloadInvoice = async (req, res, next) => {
    try {
        const bill = await billingService.getBillById(
            req.params.id,
            req.user.sub,
            req.user.role,
            req.user.hospitalId
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice-${bill.invoiceNumber}.pdf`);

        billingService.generateInvoicePDF(bill, res);
    } catch (error) {
        next(error);
    }
};

const collectPayment = async (req, res, next) => {
    try {
        const hospitalId = req.user.hospitalId;
        if (!hospitalId) {
            return res.status(400).json({ success: false, message: 'Staff must belong to a hospital to collect payment' });
        }

        const transaction = await billingService.collectDecentralizedPayment(req.body, req.user.sub, hospitalId);

        res.status(201).json({
            success: true,
            message: 'Payment collected and logged successfully',
            data: transaction
        });
    } catch (error) {
        next(error);
    }
};

const getTransactions = async (req, res, next) => {
    try {
        const transactions = await billingService.getTransactions(
            req.user.sub,
            req.user.role,
            req.user.hospitalId,
            req.query
        );

        res.status(200).json({
            success: true,
            data: transactions
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createBilling,
    getBills,
    getBillById,
    updatePayment,
    downloadInvoice,
    collectPayment,
    getTransactions
};
