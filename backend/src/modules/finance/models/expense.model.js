const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    expenseName: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['Utility Bill', 'Maintenance', 'Equipment Purchase', 'Medicine Purchase', 'Marketing', 'Miscellaneous', 'Other'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    dateIncurred: {
        type: Date,
        required: true,
        default: Date.now
    },
    description: {
        type: String,
        trim: true
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth', // financial_manager who recorded it
        required: true
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    }
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
