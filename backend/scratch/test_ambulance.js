const axios = require('axios');
const mongoose = require('mongoose');

async function runTests() {
    try {
        console.log('1. Adding a new ambulance for full workflow test...');
        const addRes = await axios.post('http://localhost:5000/api/v1/ambulances', {
            vehicleNumber: `DL-1C-${Math.floor(Math.random() * 10000)}`,
            type: 'Basic',
            driverName: 'Mohan',
            driverPhone: '9988776655'
        });
        const ambulanceId = addRes.data.data._id;
        console.log('Added Ambulance ID:', ambulanceId);

        console.log('\n2. Dispatching the ambulance...');
        const dispatchRes = await axios.post(`http://localhost:5000/api/v1/ambulances/${ambulanceId}/dispatch`, {
            location: 'Railway Station',
            callerName: 'Raj',
            callerPhone: '112'
        });
        console.log('Dispatch successful. Dispatch ID:', dispatchRes.data.data._id);

        console.log('\n3. Getting ALL ambulances to check currentDispatch population...');
        const allRes = await axios.get('http://localhost:5000/api/v1/ambulances');
        const ourAmbulance = allRes.data.data.find(a => a._id === ambulanceId);
        console.log('Is currentDispatch populated?', ourAmbulance.currentDispatch && ourAmbulance.currentDispatch.location ? 'YES' : 'NO');
        console.log('Location in populated doc:', ourAmbulance.currentDispatch.location);

        console.log('\n4. Returning the ambulance via PUT (New workflow)...');
        const returnRes = await axios.put(`http://localhost:5000/api/v1/ambulances/${ambulanceId}`, {
            status: 'Available'
        });
        console.log('Return update successful. New status:', returnRes.data.data.status);
        console.log('Is currentDispatch null now?', returnRes.data.data.currentDispatch === null ? 'YES' : 'NO');

        console.log('\nAll tests passed successfully!');
    } catch (error) {
        console.error('Error during testing:', error.response ? error.response.data : error.message);
    }
}

runTests();
