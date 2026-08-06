const mongoose = require('mongoose');

const patientVitalsSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    allocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BedAllocation',
        required: true
    },
    nurse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth', // Who recorded the vitals
        required: true
    },
    bloodPressure: {
        type: String, // e.g., '120/80'
        trim: true
    },
    heartRate: {
        type: Number, // bpm
        min: 0
    },
    temperature: {
        type: Number, // in Fahrenheit or Celsius
    },
    respiratoryRate: {
        type: Number, // breaths per minute
        min: 0
    },
    oxygenSaturation: {
        type: Number, // SpO2 %
        min: 0,
        max: 100
    },
    notes: {
        type: String,
        trim: true
    },
    recordedAt: {
        type: Date,
        default: Date.now
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    }
}, { timestamps: true });

const PatientVitals = mongoose.model('PatientVitals', patientVitalsSchema);

module.exports = PatientVitals;
