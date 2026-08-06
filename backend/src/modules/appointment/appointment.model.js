const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientModel: {
        type: String,
        required: true,
        enum: ['Patient', 'Auth'],
        default: 'Patient'
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'patientModel',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    hospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    },
    // Fields for bookAppointment (HEAD)
    date: {
        type: Date,
        required: false
    },
    timeSlot: {
        type: String,
        required: false
    },
    slot: {
        type: String,
        required: false,
        trim: true
    },
    type: {
        type: String,
        enum: ['physical', 'video', 'chat', 'audio'],
        default: 'physical'
    },
    meetLink: {
        type: String,
        trim: true
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    notes: {
        type: String,
        trim: true
    },
    consultationFee: {
        type: Number,
        required: false
    },
    razorpayOrderId: {
        type: String,
        trim: true
    },

    // Fields for createAppointment (laxman branch)
    appointmentDate: {
        type: Date,
        required: false
    },
    startTime: {
        type: String,
        required: false
    },
    endTime: {
        type: String,
        required: false
    },
    appointmentType: {
        type: String,
        enum: ['physical', 'video', 'chat', 'audio'],
        default: 'physical'
    },
    reason: {
        type: String
    },
    bookingMode: {
        type: String,
        enum: ['online', 'walk-in'],
        default: 'online'
    },

    // Merged status and paymentStatus
    status: {
        type: String,
        enum: ['booked', 'completed', 'cancelled', 'pending_payment', 'confirmed', 'pending'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'success', 'failed', 'paid'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'online'],
        required: false
    }
}, { timestamps: true });

// INDEX
appointmentSchema.index({
  doctor: 1,
  appointmentDate: 1,
  startTime: 1,
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;
