const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    dosage: {
        type: String, // e.g., '500mg'
        required: true,
        trim: true
    },
    frequency: {
        type: String, // e.g., 'Twice a day'
        required: true,
        trim: true
    },
    duration: {
        type: String, // e.g., '5 days'
        required: true,
        trim: true
    },
    instructions: {
        type: String, // e.g., 'After food'
        trim: true
    },
    isOutsidePharmacy: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
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
    consultation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Consultation'
    },
    patientType: {
        type: String,
        enum: ['OPD', 'IPD'],
        default: 'OPD'
    },
    allocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BedAllocation'
    },
    medicines: [medicineSchema],
    generalInstructions: {
        type: String,
        trim: true
    },
    pdfPath: {
        type: String,
        default: ''
    }
}, { timestamps: true });

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;
