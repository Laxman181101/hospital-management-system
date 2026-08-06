const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
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
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    closedAt: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
