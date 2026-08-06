const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    dose: {
        type: String,
        trim: true
    },
    route: {
        type: String,
        enum: ['Oral', 'IV', 'IM', 'Topical', 'Subcutaneous', 'Inhalation', 'Sublingual', 'Other'],
        default: 'Oral'
    },
    frequency: {
        type: String,
        enum: ['OD', 'BD', 'TDS', 'QID', 'SOS', 'Stat', 'ON', 'Weekly', 'Other'],
        default: 'OD'
    },
    duration: {
        type: String,
        trim: true
    },
    instructions: {
        type: String,
        trim: true
    }
}, { _id: false });

const ipdDailyRoundSchema = new mongoose.Schema({
    allocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BedAllocation',
        required: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth',
        required: true
    },
    roundDate: {
        type: Date,
        default: Date.now
    },
    roundType: {
        type: String,
        enum: ['Morning', 'Evening', 'Night', 'Emergency'],
        default: 'Morning'
    },
    chiefComplaints: {
        type: String,
        trim: true
    },
    clinicalNotes: {
        type: String,
        trim: true
    },
    diagnosis: {
        type: String,
        trim: true
    },
    medications: [medicationSchema],
    labOrdersRequested: [String],
    followUpPlan: {
        type: String,
        trim: true
    },
    pharmacyOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PharmacyOrder'
    },
    medicationsDispensed: {
        type: Boolean,
        default: false  // Pharmacist ne ward mein bheja ya nahi
    },
    dispensedAt: {
        type: Date
    },
    dispensedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth'  // Kis pharmacist ne bheja
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    }
}, { timestamps: true });

const IpdDailyRound = mongoose.model('IpdDailyRound', ipdDailyRoundSchema);

module.exports = IpdDailyRound;
