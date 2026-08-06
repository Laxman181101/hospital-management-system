const axios = require('axios');
const API_URL = 'http://localhost:5000/api/v1';

async function runTest() {
    try {
        console.log('--- Starting Lab Flow Test ---\n');

        // 1. Login as Doctor
        console.log('[1] Logging in as Doctor...');
        const docLoginRes = await axios.post(`${API_URL}/auth/login`, {
            loginId: 'doctor@gmail.com',
            password: '123456'
        });
        const doctorToken = docLoginRes.data.tokens.accessToken;
        const docAxios = axios.create({ headers: { Authorization: `Bearer ${doctorToken}` } });
        
        let patRes = await docAxios.get(`${API_URL}/patients`);
        let patients = patRes.data.data || patRes.data;
        if (!patients || patients.length === 0) {
            throw new Error("No patients found for doctor to prescribe to");
        }
        const patientId = patients[0]._id;
        
        // 2. Fetch Lab Inventory
        console.log('\n[2] Fetching Lab Inventory...');
        const inventoryRes = await docAxios.get(`${API_URL}/laboratory/tests`);
        if (!inventoryRes.data.data || inventoryRes.data.data.length === 0) {
            throw new Error("No lab tests found in inventory");
        }
        const testId = inventoryRes.data.data[0]._id;
        console.log(`✓ Fetched Lab Test ID: ${testId}`);

        // 3. Doctor requests Lab Test
        console.log('\n[3] Doctor prescribes Lab Test...');
        const reqData = {
            patient: patientId,
            tests: [testId],
            paymentStatus: 'Unpaid'
        };
        const reqRes = await docAxios.post(`${API_URL}/laboratory/requests`, reqData);
        const requestId = reqRes.data.data._id;
        console.log(`✓ Lab Request created successfully. Request ID: ${requestId}`);

        // 4. Login as Lab Technician
        console.log('\n[4] Logging in as Lab Technician...');
        const labLoginRes = await axios.post(`${API_URL}/auth/login`, {
            loginId: 'labtech@gmail.com',
            password: '123456'
        });
        const labTechToken = labLoginRes.data.tokens.accessToken;
        console.log('✓ Lab Technician logged in.');

        const labAxios = axios.create({ headers: { Authorization: `Bearer ${labTechToken}` } });
        
        // 5. Fetch requests as lab technician
        const fetchRes = await labAxios.get(`${API_URL}/laboratory/requests`);
        const requestCount = fetchRes.data.data.length;
        console.log(`✓ Fetched requests. Count: ${requestCount}`);
        
        // 6. Update status to Sample Collected
        console.log('\n[6] Lab Technician updates status to Sample Collected...');
        const testItemId = reqRes.data.data.tests[0]._id;
        const updateRes = await labAxios.patch(`${API_URL}/laboratory/requests/${requestId}/tests/${testItemId}/status`, {
            status: 'Sample Collected'
        });
        console.log(`✓ Status updated. New overall status: ${updateRes.data.data.overallStatus}`);

        console.log('\n--- Test Completed Successfully ---');
    } catch (error) {
        console.error('\nTest Failed:', error.response?.data || error.message);
    }
}

runTest();
