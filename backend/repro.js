const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api/v1';

// Generate token for the receptionist
const token = jwt.sign(
    { sub: '6a4b76735a5110e7c24f2de0', role: 'receptionist', hospitalId: '6a4a85ffbdc1f4e1490e975f' },
    process.env.JWT_SECRET || 'your_super_secret_jwt_key',
    { expiresIn: '1h' }
);

const api = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` }
});

async function runRepro() {
    try {
        console.log('1. Registering a patient...');
        const patRes = await api.post('/patients/manual', {
            firstName: 'Test',
            lastName: 'Repro',
            mobile: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
            email: 'test' + Date.now() + '@gmail.com',
            gender: 'male'
        });
        const patientId = patRes.data.patient._id;
        console.log(`✅ Patient registered: ${patientId}`);

        console.log('2. Fetching doctors to assign...');
        const docRes = await api.get('/doctors');
        const doctors = docRes.data.doctors || docRes.data.data || [];
        if (doctors.length === 0) throw new Error('No doctors found');
        const doctorId = doctors[0]._id;
        console.log(`✅ Found doctor: ${doctorId}`);

        console.log('3. Booking appointment...');
        const apptRes = await api.post('/appointments', {
            patient: patientId,
            doctor: doctorId,
            appointmentDate: '2026-07-09T10:00:00.000Z',
            startTime: '10:00',
            endTime: '10:15',
            appointmentType: 'physical',
            bookingMode: 'walk-in',
            hospital: '6a4a85ffbdc1f4e1490e975f'
        });
        const appointmentId = apptRes.data.data._id;
        console.log(`✅ Appointment booked: ${appointmentId}`);

        console.log('4. Fetching appointments list...');
        const listRes = await api.get('/appointments');
        const appointments = listRes.data.data || [];
        const found = appointments.find(a => a._id === appointmentId);
        
        if (found) {
            console.log(`✅ Appointment found in list!`);
            console.log(`   Patient populated:`, !!found.patient, found.patient ? found.patient.name : 'NULL');
            console.log(`   Doctor populated:`, !!found.doctor, found.doctor ? found.doctor.name : 'NULL');
        } else {
            console.log(`❌ Appointment NOT found in list!`);
        }

    } catch (error) {
        console.error('❌ Error during repro:', error.response?.data || error.message);
    }
}

runRepro();
