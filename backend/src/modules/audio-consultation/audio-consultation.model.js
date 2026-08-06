const mongoose = require('mongoose');

const audioConsultationSchema = new mongoose.Schema({
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
    scheduledDate: {
        type: Date,
        required: true
    },
    meetingLink: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
        default: 'scheduled'
    }
}, { timestamps: true });

const AudioConsultation = mongoose.model('AudioConsultation', audioConsultationSchema);

module.exports = AudioConsultation;
