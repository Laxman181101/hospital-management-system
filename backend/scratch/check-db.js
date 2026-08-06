require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const Auth = require('../src/modules/auth/auth.model');
const Hospital = require('../src/modules/hospital/hospital.model');
const LabTest = require('../src/modules/laboratory/models/labTest.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const doc = await Auth.findOne({ email: 'doctor@gmail.com' });
    console.log('Doctor hospitalId:', doc.hospitalId);

    const tests = await LabTest.find();
    console.log('All tests:', tests.map(t => ({ name: t.testName, hospitalId: t.hospitalId })));

    process.exit(0);
}
run();
