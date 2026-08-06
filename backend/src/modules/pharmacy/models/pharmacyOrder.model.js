const mongoose = require('mongoose');

const dispensedMedicineSchema = new mongoose.Schema({
    medicine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const pharmacyOrderSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    prescription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription'
        // Optional, can be OTC (Over The Counter) without a system prescription
    },
    ipdRound: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IpdDailyRound'
        // For fulfilling IPD medicines
    },
    medicines: [dispensedMedicineSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Dispensed', 'Cancelled'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Unpaid', 'Paid'],
        default: 'Unpaid'
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Online', 'Card', 'UPI'],
        default: 'Cash'
    },
    patientType: {
        type: String,
        enum: ['OPD', 'IPD'],
        default: 'OPD'
    },
    pharmacist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth' // Who dispensed it
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    }
}, { timestamps: true });

const PharmacyOrder = mongoose.model('PharmacyOrder', pharmacyOrderSchema);

module.exports = PharmacyOrder;
