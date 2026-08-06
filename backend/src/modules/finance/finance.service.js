const Expense = require('./models/expense.model');
const Payroll = require('./models/payroll.model');
const Auth = require('../auth/auth.model');
const Billing = require('../billing/billing.model');
const mongoose = require('mongoose');

// --- Expenses ---
const addExpense = async (hospitalId, managerId, data) => {
    const expense = new Expense({
        ...data,
        recordedBy: managerId,
        hospitalId
    });
    await expense.save();
    return expense;
};

const getExpenses = async (hospitalId, queryParams) => {
    const filter = { hospitalId };
    
    if (queryParams.category) {
        filter.category = queryParams.category;
    }
    
    // Filter by Date Range if provided
    if (queryParams.startDate && queryParams.endDate) {
        filter.dateIncurred = {
            $gte: new Date(queryParams.startDate),
            $lte: new Date(queryParams.endDate)
        };
    }

    return await Expense.find(filter)
        .populate({ path: 'recordedBy', select: 'firstName lastName' })
        .sort({ dateIncurred: -1 });
};

// --- Payroll ---
const createPayroll = async (hospitalId, managerId, data) => {
    // Check if staff exists and belongs to the same hospital
    const staffUser = await Auth.findOne({ _id: data.staff, hospitalId });
    if (!staffUser) {
        throw new Error('Staff member not found in this hospital');
    }

    // Handled by pre-save index (unique constraint), but let's give a clear message
    const existing = await Payroll.findOne({ staff: data.staff, salaryMonth: data.salaryMonth, hospitalId });
    if (existing) {
        throw new Error(`Payroll for ${staffUser.firstName} for month ${data.salaryMonth} already exists.`);
    }

    const netSalary = data.basicSalary + (data.bonus || 0) - (data.deductions || 0);

    const payroll = new Payroll({
        ...data,
        netSalary,
        processedBy: managerId,
        hospitalId
    });
    
    await payroll.save();
    return payroll;
};

const getPayrolls = async (hospitalId, queryParams) => {
    const filter = { hospitalId };

    if (queryParams.staff) filter.staff = queryParams.staff;
    if (queryParams.salaryMonth) filter.salaryMonth = queryParams.salaryMonth;
    if (queryParams.status) filter.status = queryParams.status;

    return await Payroll.find(filter)
        .populate({ path: 'staff', select: 'firstName lastName role email' })
        .populate({ path: 'processedBy', select: 'firstName lastName' })
        .sort({ salaryMonth: -1 });
};

const updatePayrollStatus = async (hospitalId, payrollId, managerId, status) => {
    const payroll = await Payroll.findOne({ _id: payrollId, hospitalId });
    if (!payroll) throw new Error('Payroll record not found');

    payroll.status = status;
    payroll.processedBy = managerId;
    await payroll.save(); // pre-save sets paymentDate if 'Paid'
    
    return payroll;
};

// --- Financial Overview (Profit/Loss) ---
const getFinancialOverview = async (hospitalId, queryParams) => {
    // Default to current month if no dates provided
    let startDate, endDate;

    if (queryParams.startDate && queryParams.endDate) {
        startDate = new Date(queryParams.startDate);
        endDate = new Date(queryParams.endDate);
    } else {
        const date = new Date();
        startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    }

    const hospitalObjectId = new mongoose.Types.ObjectId(hospitalId);

    // 1. Calculate Total Incomes from Invoices (Only Paid ones)
    const incomes = await Billing.aggregate([
        { $match: { 
            hospital: hospitalObjectId,
            paymentStatus: 'paid',
            createdAt: { $gte: startDate, $lte: endDate }
        }},
        { $group: { _id: null, totalIncome: { $sum: '$payableAmount' } } }
    ]);
    const totalIncome = incomes.length > 0 ? incomes[0].totalIncome : 0;

    // 2. Calculate Total Expenses
    const expenses = await Expense.aggregate([
        { $match: { 
            hospitalId: hospitalObjectId, 
            dateIncurred: { $gte: startDate, $lte: endDate }
        }},
        { $group: { _id: null, totalExpense: { $sum: '$amount' } } }
    ]);
    const totalExpense = expenses.length > 0 ? expenses[0].totalExpense : 0;

    // 3. Calculate Total Payroll (Only Paid)
    const payrolls = await Payroll.aggregate([
        { $match: { 
            hospitalId: hospitalObjectId, 
            status: 'Paid',
            paymentDate: { $gte: startDate, $lte: endDate }
        }},
        { $group: { _id: null, totalPayroll: { $sum: '$netSalary' } } }
    ]);
    const totalPayroll = payrolls.length > 0 ? payrolls[0].totalPayroll : 0;

    // 4. Net Profit
    const netProfit = totalIncome - (totalExpense + totalPayroll);

    return {
        period: {
            startDate,
            endDate
        },
        revenue: {
            totalIncome
        },
        expenditures: {
            totalExpense,
            totalPayrollPaid: totalPayroll,
            overallOutflow: totalExpense + totalPayroll
        },
        profitability: {
            netProfit,
            status: netProfit >= 0 ? 'Profit' : 'Loss'
        }
    };
};

module.exports = {
    addExpense,
    getExpenses,
    createPayroll,
    getPayrolls,
    updatePayrollStatus,
    getFinancialOverview
};
