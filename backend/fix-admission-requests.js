const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    }
};

const fixAdmissionRequests = async () => {
    await connectDB();

    const AdmissionRequest = require('./src/modules/ward/models/admissionRequest.model');
    const Patient = require('./src/modules/patient/patient.model');

    const requests = await AdmissionRequest.find({});
    let updatedCount = 0;

    for (const req of requests) {
        const patientDoc = await Patient.findById(req.patient);
        if (!patientDoc) {
            // It might be a user ID
            const patientByUser = await Patient.findOne({ user: req.patient });
            if (patientByUser) {
                req.patient = patientByUser._id;
                await req.save();
                updatedCount++;
                console.log(`Updated admission request ${req._id} with correct patient ID`);
            } else {
                console.log(`Could not find patient profile for admission request ${req._id}. It might be corrupted.`);
            }
        }
    }

    console.log(`Finished fixing admission requests. Updated ${updatedCount} records.`);
    process.exit(0);
};

fixAdmissionRequests();
