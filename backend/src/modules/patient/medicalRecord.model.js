const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    medicineName: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    timing: { type: String, trim: true },
    instructions: { type: String, trim: true }
}, { _id: false });

const labReportSchema = new mongoose.Schema({
    reportName: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const medicalRecordSchema = new mongoose.Schema({
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
        ref: 'Appointment'
    },
    symptoms: {
        type: [String],
        default: []
    },
    diagnosis: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    followUpDate: {
        type: Date
    },
    prescriptions: [prescriptionSchema],
    labReports: [labReportSchema],
    vitals: {
        bloodPressure: { type: String, trim: true },
        sugar: { type: String, trim: true },
        weight: { type: String, trim: true },
        temperature: { type: String, trim: true }
    }
}, {
    timestamps: true
});

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
module.exports = MedicalRecord;
