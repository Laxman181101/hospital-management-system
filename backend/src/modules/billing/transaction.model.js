const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    module: {
        type: String,
        enum: ['Appointment', 'Pharmacy', 'Laboratory', 'Radiology', 'IPD_Deposit', 'IPD_Final_Bill', 'Other'],
        required: true
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId, // ID of PharmacyOrder, LabRequest, etc.
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Card', 'UPI', 'Insurance'],
        default: 'Cash'
    },
    collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth', // The staff member who took the money (Receptionist, Lab Tech, etc.)
        required: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    },
    status: {
        type: String,
        enum: ['Completed', 'Refunded'],
        default: 'Completed'
    },
    notes: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Prevent modification after creation to ensure audit trail
transactionSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    if (update.amount !== undefined || update.collectedBy !== undefined) {
        return next(new Error('Strict Audit: Cannot modify transaction amount or collector. Must issue a refund instead.'));
    }
    next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
