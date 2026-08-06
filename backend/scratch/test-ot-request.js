const axios = require('axios');
const API_URL = 'http://localhost:5000/api/v1';

async function runTest() {
    try {
        console.log('--- Starting OT Request & Approve Flow Test ---\n');

        // 1. Login as Doctor
        console.log('[1] Logging in as Doctor...');
        const docLoginRes = await axios.post(`${API_URL}/auth/login`, {
            loginId: 'doctor@gmail.com',
            password: '123456'
        });
        const doctorToken = docLoginRes.data.tokens.accessToken;
        const doctorId = docLoginRes.data.user._id || docLoginRes.data.user.id;
        const docAxios = axios.create({ headers: { Authorization: `Bearer ${doctorToken}` } });
        console.log(`✓ Doctor logged in. Doctor ID: ${doctorId}`);

        // Fetch a patient
        let patRes = await docAxios.get(`${API_URL}/patients`);
        let patients = patRes.data.data || patRes.data;
        if (patients.length === 0) throw new Error("No patients found in DB.");
        const patientId = patients[0]._id;
        console.log(`✓ Selected Patient ID: ${patientId}`);

        // 2. Doctor requests a Surgery
        console.log('\n[2] Doctor is requesting an OT Slot...');
        const reqData = {
            patientId,
            surgeonId: doctorId,
            surgeryName: 'Test Request Surgery ' + Date.now(),
            scheduledDate: new Date(Date.now() + 86400000).toISOString(),
            preOpNotes: 'Needs C-Arm equipment'
        };
        const reqRes = await docAxios.post(`${API_URL}/operation-theaters/requests`, reqData);
        const surgeryId = reqRes.data.data._id;
        console.log(`✓ Doctor requested surgery successfully. Surgery ID: ${surgeryId}`);

        // 3. Login as Receptionist
        console.log('\n[3] Logging in as Receptionist...');
        const recLoginRes = await axios.post(`${API_URL}/auth/login`, {
            loginId: 'onereceptionist@gmail.com',
            password: '123456'
        });
        const receptionistToken = recLoginRes.data.tokens.accessToken;
        const recAxios = axios.create({ headers: { Authorization: `Bearer ${receptionistToken}` } });
        console.log('✓ Receptionist logged in.');

        // Get an OT Room
        let roomsRes = await recAxios.get(`${API_URL}/operation-theaters/rooms`);
        let rooms = roomsRes.data.data;
        let roomId;
        if (rooms.length > 0) {
            roomId = rooms[0]._id;
        } else {
            console.log('No OT Rooms found. Creating one...');
            const roomRes = await recAxios.post(`${API_URL}/operation-theaters/rooms`, {
                name: 'Emergency OT',
                type: 'General',
                capacity: 1
            });
            roomId = roomRes.data.data._id;
        }
        console.log(`✓ Using OT Room ID: ${roomId}`);

        // 4. Receptionist Approves the request
        console.log('\n[4] Receptionist is approving and scheduling the surgery...');
        const approveData = {
            operationTheaterId: roomId,
            scheduledDate: new Date(Date.now() + 86400000).toISOString(),
            startTime: '10:00',
            endTime: '12:00'
        };
        const approveRes = await recAxios.patch(`${API_URL}/operation-theaters/surgeries/${surgeryId}/schedule`, approveData);
        console.log(`✓ Surgery approved successfully. New Status: ${approveRes.data.data.status}`);

        console.log('\n--- Test Completed Successfully ---');
    } catch (error) {
        console.error('\nTest Failed:', error.response?.data || error.message);
    }
}

runTest();
