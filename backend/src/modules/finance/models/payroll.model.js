const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
    staff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth', // e.g., Doctor, Nurse, Receptionist, etc.
        required: true
    },
    salaryMonth: {
        type: String, // format 'YYYY-MM', e.g., '2023-10'
        required: true
    },
    basicSalary: {
        type: Number,
        required: true,
        min: 0
    },
    bonus: {
        type: Number,
        default: 0,
        min: 0
    },
    deductions: {
        type: Number,
        default: 0,
        min: 0
    },
    netSalary: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Paid'],
        default: 'Pending'
    },
    paymentDate: {
        type: Date
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth' // financial_manager who processed it
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    }
}, { timestamps: true });

// Pre-save to auto calculate netSalary
payrollSchema.pre('save', function() {
    this.netSalary = this.basicSalary + (this.bonus || 0) - (this.deductions || 0);
    if (this.status === 'Paid' && !this.paymentDate) {
        this.paymentDate = Date.now();
    }
});

// Ensure a staff member only gets one payroll entry per month per hospital
payrollSchema.index({ staff: 1, salaryMonth: 1, hospitalId: 1 }, { unique: true });

const Payroll = mongoose.model('Payroll', payrollSchema);

module.exports = Payroll;
