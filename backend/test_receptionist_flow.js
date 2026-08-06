const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');
const axios = require('axios');
const app = require('./src/app');
const env = require('./src/config/env');
const connectDB = require('./src/config/db');
const Auth = require('./src/modules/auth/auth.model');
const Patient = require('./src/modules/patient/patient.model');

async function runTest() {
    console.log("Starting test...");
    await connectDB();
    
    const server = http.createServer(app);
    const port = 6677;
    server.listen(port);
    
    try {
        console.log("Creating/Finding mock receptionist...");
        let receptionist = await Auth.findOne({ role: 'receptionist' });
        if (!receptionist) {
            receptionist = await Auth.create({
                firstName: "Test",
                lastName: "Receptionist",
                email: "rec@test.com",
                mobile: "9999999999",
                password: "Password123",
                role: "receptionist",
                isApproved: true
            });
        }
        
        const { generateToken } = require('./src/config/jwt');
        const token = generateToken({ sub: receptionist._id, role: receptionist.role, hospitalId: receptionist.hospitalId });
        const headers = { Authorization: `Bearer ${token}` };
        
        console.log("1. Receptionist creates an emergency patient profile...");
        const randomStr = Date.now().toString();
        const createRes = await axios.post(`http://localhost:${port}/api/v1/patients/manual`, {
            name: "Unknown Accident Victim",
            firstName: "Unknown",
            lastName: "Accident Victim",
            email: `unknown${randomStr}@example.com`,
            mobile: randomStr.substring(3),
            password: "tempPassword123",
            symptoms: "Unconscious, head trauma",
            gender: "male",
            bloodGroup: "O+"
        }, { headers });
        
        console.log("Patient created with ID:", createRes.data.patient._id);
        const patientId = createRes.data.patient._id;
        
        console.log("2. Receptionist attempts to update the profile later...");
        const updateRes = await axios.put(`http://localhost:${port}/api/v1/patients/profile/${patientId}`, {
            firstName: "John",
            lastName: "Doe",
            mobile: "9876543210"
        }, { headers });
        
        console.log("Update response status:", updateRes.status);
        console.log("Updated Name:", updateRes.data.data.firstName, updateRes.data.data.lastName);
        
        console.log("\n✅ SUCCESS: The Receptionist was successfully able to create AND update the patient profile!");
        
        // Clean up the test patient
        await Patient.findByIdAndDelete(patientId);
        
    } catch (error) {
        console.error("❌ TEST FAILED:", error.response ? error.response.data : error.message);
    } finally {
        server.close();
        mongoose.disconnect();
        process.exit(0);
    }
}

runTest();
