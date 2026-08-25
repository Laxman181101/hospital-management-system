const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true
    },
    startTime: {
        type: String, // e.g., '09:00 AM'
        required: true
    },
    endTime: {
        type: String, // e.g., '05:00 PM'
        required: true
    }
}, { _id: false });

const doctorSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth', // Reference to the Auth module (user account)
        required: true
    },
    hospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital', // Reference to Hospital module (which Pushpendra is building)
        required: true
    },
    name: {
        type: String,
        required: true
    },
    specialization: {
        type: String,
        required: true
    },
    consultationFee: {
        type: Number,
        required: true
    },
    consultationDuration: {
        type: Number,
        default: 20
    },
    availabilitySchedule: [availabilitySchema],
    consultationModes: {
        type: [String],
        enum: ['physical', 'video', 'audio', 'chat'],
        default: ['physical', 'video', 'audio', 'chat']
    },
    qualifications: [{
        type: String
    }],
    experience: {
        type: Number, // In years
        default: 0
    }
}, { timestamps: true });

const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;
