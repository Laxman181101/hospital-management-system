const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
    try {
        await mongoose.connect(env.dbUri);
        console.log('Connected to MongoDB successfully');

        // Ensure all hospitals and doctors have full telehealth modes enabled
        try {
            const Hospital = require('../modules/hospital/hospital.model');
            const Doctor = require('../modules/doctor/doctor.model');
            
            await Hospital.updateMany(
                { $or: [{ 'settings.supportedConsultations': { $exists: false } }, { 'settings.supportedConsultations': ['physical'] }, { 'settings.supportedConsultations': { $size: 0 } }] },
                { $set: { 'settings.supportedConsultations': ['physical', 'video', 'audio', 'chat'] } }
            );

            await Doctor.updateMany(
                { $or: [{ consultationModes: { $exists: false } }, { consultationModes: ['physical'] }, { consultationModes: { $size: 0 } }] },
                { $set: { consultationModes: ['physical', 'video', 'audio', 'chat'] } }
            );
            const Appointment = require('../modules/appointment/appointment.model');
            await Appointment.updateMany(
                { appointmentType: { $exists: true, $ne: 'physical' } },
                [{ $set: { type: "$appointmentType" } }]
            );
        } catch (syncErr) {
            console.warn('Sync notice:', syncErr.message);
        }
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
