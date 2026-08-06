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

const endpointsToTest = [
    { method: 'GET', url: '/appointments', name: 'Dashboard Appointments' },
    { method: 'POST', url: '/attendance/check-in', name: 'Attendance Check-in' },
    { method: 'GET', url: '/patients', name: 'Patients List' },
    { method: 'GET', url: '/operation-theaters/surgeries', name: 'OT Surgeries' },
    { method: 'GET', url: '/operation-theaters/rooms', name: 'OT Rooms' },
    { method: 'GET', url: '/ward/wards', name: 'Wards' },
    { method: 'GET', url: '/ward/admissions', name: 'Ward Admissions' },
    { method: 'GET', url: '/ward/admission-requests', name: 'Ward Admission Requests' },
    { method: 'GET', url: '/doctors', name: 'Doctor Schedules' },
    { method: 'GET', url: '/billing', name: 'Billing Invoices' }
];

async function runAudit() {
    console.log('--- RECEPTIONIST API AUDIT ---');
    for (const ep of endpointsToTest) {
        try {
            let res;
            if (ep.method === 'GET') res = await api.get(ep.url);
            if (ep.method === 'POST') res = await api.post(ep.url, ep.data || {});
            
            console.log(`✅ [${ep.name}] ${ep.method} ${ep.url} -> ${res.status}`);
            
            if (Array.isArray(res.data)) {
                console.log(`   Data is ARRAY (length: ${res.data.length})`);
            } else if (typeof res.data === 'object' && res.data !== null) {
                console.log(`   Data Keys:`, Object.keys(res.data));
                if (res.data.data && Array.isArray(res.data.data)) {
                    console.log(`   res.data.data is ARRAY (length: ${res.data.data.length})`);
                }
            } else {
                console.log(`   Data is:`, typeof res.data);
            }
        } catch (error) {
            console.log(`❌ [${ep.name}] ${ep.method} ${ep.url} -> FAILED`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Data:`, error.response.data);
            } else {
                console.log(`   Error:`, error.message);
            }
        }
    }
}

runAudit();
