const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    },
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true
    },
    razorpayOrderId: {
        type: String,
        trim: true
    },
    razorpayPaymentId: {
        type: String,
        trim: true
    },
    razorpaySignature: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
        required: true
    },
    amountInPaise: {
        type: Number
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded', 'success'], // 'success' is kept for backward-compatibility with existing tests
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        trim: true
    },
    receiptUrl: {
        type: String,
        trim: true
    },
    refundId: {
        type: String,
        trim: true
    },
    refundAmount: {
        type: Number
    },
    refundStatus: {
        type: String,
        trim: true
    },
    paidAt: {
        type: Date
    }
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
