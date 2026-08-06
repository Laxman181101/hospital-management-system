const mongoose = require('mongoose');

const surgerySchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    },
    admissionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BedAllocation'
    },
    operationTheaterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OperationTheater'
    },
    surgeonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    anesthetistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    },
    surgeryName: {
        type: String,
        required: true,
        trim: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String // HH:mm format
    },
    endTime: {
        type: String // HH:mm format
    },
    status: {
        type: String,
        enum: ['Requested', 'Scheduled', 'In-Progress', 'Recovery', 'Completed', 'Cancelled', 'Rescheduled'],
        default: 'Requested'
    },
    preOpNotes: {
        type: String
    },
    postOpNotes: {
        type: String
    },
    statusHistory: [{
        status: {
            type: String,
            enum: ['Requested', 'Scheduled', 'In-Progress', 'Recovery', 'Completed', 'Cancelled', 'Rescheduled']
        },
        changedAt: {
            type: Date,
            default: Date.now
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    otRoomCharge: {
        type: Number,
        default: 0
    },
    surgeonFee: {
        type: Number,
        default: 0
    },
    anesthetistFee: {
        type: Number,
        default: 0
    },
    consumableCharges: {
        type: Number,
        default: 0
    },
    paymentStatus: {
        type: String,
        enum: ['Unpaid', 'Paid'],
        default: 'Unpaid'
    }
}, { timestamps: true });

module.exports = mongoose.model('Surgery', surgerySchema);
