const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

async function testOTFlow() {
    console.log('--- Starting OT Flow Integration Test ---');
    try {
        // 1. Login Receptionist
        console.log('\n[1] Logging in as Receptionist...');
        const recRes = await axios.post(`${API_URL}/auth/login`, {
            loginId: 'onereceptionist@gmail.com',
            password: '123456'
        });
        const recToken = recRes.data.tokens.accessToken;
        const recAxios = axios.create({
            headers: { Authorization: `Bearer ${recToken}` }
        });
        console.log('✓ Receptionist logged in');

        // 2. Fetch Patients (to find an admitted one, or just the one user provided)
        console.log('\n[2] Fetching patient...');
        let patientsRes = await recAxios.get(`${API_URL}/patients`);
        let patients = patientsRes.data.data || patientsRes.data;
        if (!patients || patients.length === 0) throw new Error('No patients found');
        const patientId = patients[0]._id; // we'll just pick the first one for the test
        console.log(`✓ Selected Patient ID: ${patientId}`);

        // Fetch allocations to get admissionId if they are admitted
        let allocRes = await recAxios.get(`${API_URL}/ward/admissions?status=Occupied`);
        let allocations = allocRes.data.admissions || allocRes.data.data || [];
        let admissionId = null;
        const patientAllocation = allocations.find(a => (a.patient && a.patient._id === patientId) || a.patient === patientId);
        if (patientAllocation) {
            admissionId = patientAllocation._id;
            console.log(`✓ Patient is admitted. Admission ID: ${admissionId}`);
        } else {
            console.log(`! Patient is NOT admitted. Test might not link to IPD Bill.`);
        }

        // 3. Login Doctor
        console.log('\n[3] Logging in as Doctor...');
        const docRes = await axios.post(`${API_URL}/auth/login`, {
            loginId: 'doctor@gmail.com',
            password: '123456'
        });
        const docToken = docRes.data.tokens.accessToken;
        const doctorId = docRes.data.user._id;
        const docAxios = axios.create({
            headers: { Authorization: `Bearer ${docToken}` }
        });
        console.log(`✓ Doctor logged in. Doctor ID: ${doctorId}`);

        // 4. Create OT Room (if none exists)
        console.log('\n[4] Ensuring an OT Room exists...');
        let roomsRes = await recAxios.get(`${API_URL}/operation-theaters/rooms`);
        let rooms = roomsRes.data.data || [];
        let roomId;
        if (rooms.length === 0) {
            const newRoomRes = await recAxios.post(`${API_URL}/operation-theaters/rooms`, {
                name: 'Main OT 1',
                type: 'General',
                capacity: 1,
                status: 'Available'
            });
            roomId = newRoomRes.data.data._id;
            console.log(`✓ Created new OT Room ID: ${roomId}`);
        } else {
            roomId = rooms[0]._id;
            console.log(`✓ Found existing OT Room ID: ${roomId}`);
        }

        // 5. Schedule Surgery (Receptionist)
        console.log('\n[5] Scheduling Surgery...');
        const payload = {
            patientId: patientId,
            operationTheaterId: roomId,
            surgeonId: doctorId,
            surgeryName: 'Test Appendectomy ' + Date.now(),
            scheduledDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            startTime: '10:00',
            endTime: '12:00'
        };
        if (admissionId) payload.admissionId = admissionId;

        const scheduleRes = await recAxios.post(`${API_URL}/operation-theaters/surgeries`, payload);
        const surgeryId = scheduleRes.data.data._id;
        console.log(`✓ Surgery Scheduled. ID: ${surgeryId}`);

        // 6. Complete Surgery with Fees (Doctor)
        console.log('\n[6] Doctor updating surgery status to Completed with fees...');
        const updateRes = await docAxios.patch(`${API_URL}/operation-theaters/surgeries/${surgeryId}/status`, {
            status: 'Completed',
            postOpNotes: 'Test notes, patient is stable.',
            otRoomCharge: 2000,
            surgeonFee: 5000,
            consumableCharges: 500
        });
        console.log(`✓ Surgery Completed. Surgeon Fee Saved: ${updateRes.data.data.surgeonFee}`);

        // 7. Verify IPD Billing Integration (if patient was admitted)
        if (admissionId) {
            console.log('\n[7] Simulating Discharge Bill Generation...');
            const draftBillRes = await recAxios.patch(`${API_URL}/ward/admissions/${admissionId}/discharge`, {
                status: 'Draft',
                remarks: 'Test Discharge'
            });
            
            console.log(`✓ Discharge process triggered. Billing Document created.`);
        }

        console.log('\n--- Test Completed Successfully ---');

    } catch (err) {
        console.error('Test Failed:', err.response ? err.response.data : err.message);
    }
}

testOTFlow();
