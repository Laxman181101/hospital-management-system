require('dotenv').config();
const mongoose = require('mongoose');
const Patient = require('../src/modules/patient/patient.model');

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const p = await Patient.find({ 
            $or: [
                { name: /chintu/i },
                { firstName: /chintu/i }
            ]
        });
        console.log(`Found ${p.length} chintu patients.`);
        for (const pat of p) {
            console.log(`ID: ${pat._id}, UserID: ${pat.user}, Name: ${pat.name || pat.firstName}, isDeleted: ${pat.isDeleted}`);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
check();
