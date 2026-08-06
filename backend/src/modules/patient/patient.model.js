const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema({
    condition: {
        type: String,
        required: true,
        trim: true
    },
    diagnosedDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'resolved'],
        default: 'active'
    },
    notes: {
        type: String,
        trim: true
    }
}, { _id: true });

const reportSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    filePath: {
        type: String,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const appointmentSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    },
    doctorName: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    notes: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['in-person', 'video'],
        default: 'in-person'
    },
    meetingLink: {
        type: String,
        trim: true
    }
}, { _id: true });

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    dosage: {
        type: String,
        required: true,
        trim: true // e.g., '500mg'
    },
    frequency: {
        type: String,
        required: true,
        trim: true // e.g., 'Twice a day'
    },
    duration: {
        type: String,
        required: true,
        trim: true // e.g., '5 days'
    }
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
    doctorName: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    medicines: [medicineSchema],
    instructions: {
        type: String,
        trim: true
    }
}, { _id: true });

const patientSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth',
        required: true,
        unique: true
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital'
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    password: {
        type: String
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },
    dateOfBirth: {
        type: Date
    },
    symptoms: {
        type: String,
        trim: true
    },
    bloodGroup: {
        type: String,
        trim: true
    },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true }
    },
    emergencyContact: {
        name: { type: String, trim: true },
        relationship: { type: String, trim: true },
        phone: { type: String, trim: true },
        mobile: { type: String, trim: true },
        relation: { type: String, trim: true }
    },
    photo: {
        type: String // Cloudinary URL
    },
    otp: {
        type: String
    },
    otpExpiry: {
        type: Date
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        default: 'patient'
    },
    medicalHistory: [medicalHistorySchema],
    reports: [reportSchema],
    appointments: [appointmentSchema],
    prescriptions: [prescriptionSchema],
    isDeleted: {
        type: Boolean,
        default: false
    },
    registrationMethod: {
        type: String,
        enum: ['manual', 'self'],
        default: 'self'
    }
}, { timestamps: true });

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
