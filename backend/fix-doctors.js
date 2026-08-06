require('dotenv').config();
const mongoose = require('mongoose');

const Auth = mongoose.model('Auth', new mongoose.Schema({}, {strict: false}), 'auths');
const Doctor = mongoose.model('Doctor', new mongoose.Schema({
    user: mongoose.Schema.Types.ObjectId,
    hospital: mongoose.Schema.Types.ObjectId,
    name: String,
    specialization: String,
    experience: Number,
    qualifications: [String]
}, {strict: false}), 'doctors');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('Connected to DB');
    const doctorsInAuth = await Auth.find({ role: 'doctor' });
    console.log('Found', doctorsInAuth.length, 'doctors in auth table');
    
    let created = 0;
    for (const u of doctorsInAuth) {
        const existing = await Doctor.findOne({ user: u._id });
        if (!existing) {
            await Doctor.create({
                user: u._id,
                hospital: u.hospitalId,
                name: (u.firstName + ' ' + (u.lastName || '')).trim(),
                specialization: u.specialization || 'General',
                experience: u.experience || 0,
                qualifications: u.qualifications ? [u.qualifications] : []
            });
            console.log('Created doctor profile for', u.firstName, u.lastName);
            created++;
        }
    }
    console.log('Done, created', created, 'profiles');
    process.exit(0);
}).catch(console.error);
