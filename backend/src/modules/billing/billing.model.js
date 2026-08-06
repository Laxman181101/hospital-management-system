const mongoose = require('mongoose');

const billingItemSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1
    }
});

const billingSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    hospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    },
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: false
    },
    prescription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription',
        required: false
    },
    admission: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BedAllocation',
        required: false
    },
    items: [billingItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    payableAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi', 'net_banking', 'insurance'],
        default: 'cash'
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'partially_paid', 'paid', 'refunded'],
        default: 'unpaid'
    },
    billingDate: {
        type: Date,
        default: Date.now
    },
    billingAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Billing', billingSchema);
