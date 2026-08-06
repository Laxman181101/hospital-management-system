const mongoose = require('mongoose');
const Auth = require('./src/modules/auth/auth.model');
require('dotenv').config();
const authService = require('./src/modules/auth/auth.service');

async function runTest() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const admin = await Auth.findOne({ role: 'hospital_admin' });
    if (!admin) {
        console.log('No hospital_admin found. Exiting.');
        process.exit(1);
    }
    console.log('Found Admin Email:', admin.email);
    
    try {
        console.log('Generating token directly...');
        const tokens = await authService.generateTokens(admin);
        const token = tokens.accessToken;
        console.log('Got token.');
        
        // Test 1: Add a Radiology Test
        console.log('\n--- Test 1: Add Radiology Test ---');
        const addTestPayload = {
            testName: 'Chest X-Ray PA View',
            category: 'X-Ray',
            price: 500,
            turnaroundTime: '2 Hours'
        };
        
        const addTestRes = await fetch('http://localhost:5000/api/v1/radiology/tests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(addTestPayload)
        });
        
        const addTestData = await addTestRes.json();
        console.log('Add Test Response:', addTestData);
        
        // Test 2: Get Radiology Tests
        console.log('\n--- Test 2: Get Radiology Tests ---');
        const getTestsRes = await fetch('http://localhost:5000/api/v1/radiology/tests', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const getTestsData = await getTestsRes.json();
        console.log('Get Tests Response:', getTestsData.data.length > 0 ? 'Success, found tests' : 'No tests found');

    } catch (e) {
        console.error('Test failed:', e);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
}

runTest();
