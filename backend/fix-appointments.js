require('dotenv').config();
const mongoose = require('mongoose');

const Appointment = mongoose.model('Appointment', new mongoose.Schema({}, {strict: false}), 'appointments');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('Connected to DB');
    const result = await Appointment.updateMany({ patientModel: 'Auth' }, { $set: { patientModel: 'Patient' } });
    console.log('Updated appointments:', result.modifiedCount);
    process.exit(0);
}).catch(console.error);
