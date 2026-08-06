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

async function runFetchAppointments() {
    try {
        const listRes = await api.get('/appointments');
        const appointments = listRes.data.data || [];
        
        console.log(`Fetched ${appointments.length} appointments.`);
        if (appointments.length > 0) {
            const first = appointments[0];
            console.log("Latest Appointment:", {
                id: first._id,
                date: first.appointmentDate,
                startTime: first.startTime,
                endTime: first.endTime,
                status: first.status,
                patient: first.patient ? { id: first.patient._id, name: first.patient.name } : null,
                doctor: first.doctor ? { id: first.doctor._id, name: first.doctor.name } : null
            });
        }
    } catch (error) {
        console.error('❌ Error during fetch:', error.response?.data || error.message);
    }
}

runFetchAppointments();
