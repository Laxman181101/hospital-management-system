const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    symptoms: {
        type: String,
        trim: true
    },
    complaints: {
        type: String,
        trim: true
    },
    diagnosis: {
        type: String,
        trim: true
    },
    clinicalNotes: {
        type: String,
        trim: true
    },
    observations: {
        type: String,
        trim: true
    },
    followUpDate: {
        type: Date
    },
    followUpRecommendations: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['draft', 'completed'],
        default: 'draft'
    }
}, { timestamps: true });

const Consultation = mongoose.model('Consultation', consultationSchema);

module.exports = Consultation;
