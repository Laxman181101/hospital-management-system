require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Auth = require('../src/modules/auth/auth.model');
const Hospital = require('../src/modules/hospital/hospital.model');
const LabTest = require('../src/modules/laboratory/models/labTest.model');

async function seedLab() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const doc = await Auth.findOne({ email: 'doctor@gmail.com' });
        if (!doc) throw new Error('No doctor found');
        const hospital = await Hospital.findById(doc.hospitalId);
        if (!hospital) throw new Error('No hospital found');

        // Create a lab test
        let test = await LabTest.findOne({ testName: 'Complete Blood Count (CBC)' });
        if (!test) {
            test = await LabTest.create({
                hospitalId: hospital._id,
                testName: 'Complete Blood Count (CBC)',
                category: 'Blood',
                price: 500,
                turnaroundTime: '2 hours',
                description: 'Measures different parts of your blood.'
            });
            console.log('Lab Test created for hospital', hospital._id);
        } else {
            // Update hospital ID if it was wrong
            test.hospitalId = hospital._id;
            await test.save();
            console.log('Lab Test already exists, updated hospitalId');
        }

        // Create Lab Tech
        let labTech = await Auth.findOne({ email: 'labtech@gmail.com' });
        if (!labTech) {
            const hashedPassword = await bcrypt.hash('123456', 10);
            labTech = await Auth.create({
                hospitalId: hospital._id,
                firstName: 'Laboratory',
                lastName: 'Technician',
                email: 'labtech@gmail.com',
                mobile: '8888888888',
                password: hashedPassword,
                role: 'lab_technician',
                isActive: true
            });
            console.log('Lab Tech created: labtech@gmail.com / 123456 for hospital', hospital._id);
        } else {
            labTech.hospitalId = hospital._id;
            await labTech.save();
            console.log('Lab Tech already exists: labtech@gmail.com / 123456, updated hospitalId');
        }

        console.log('Done!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seedLab();
