process.env.PORT = 5002; // Run tests on port 5002
require('dotenv').config();

const mongoose = require('mongoose');
const Patient = require('./modules/patient/patient.model');
const Appointment = require('./modules/appointment/appointment.model');
const Auth = require('./modules/auth/auth.model');
const Hospital = require('./modules/hospital/hospital.model');
const Doctor = require('./modules/doctor/doctor.model');

const testMobile = '917777777777';
const testPassword = 'MainTestPassword123!';
const testEmail = 'mainpatient@example.com';
const testName = 'Jane Main Tester';

const baseUrl = 'http://localhost:5002/api/v1/patients';

// Helper to delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
    console.log('\n======================================================');
    console.log('STARTING MAIN PROJECT PATIENT INTEGRATION TESTS');
    console.log('======================================================\n');

    // Require and start the main server
    console.log('Booting up the main Express server on port 5002...');
    const serverFile = require('../server');

    // Wait 4 seconds for DB connection and server to start listening
    await sleep(4000);

    let testPatientId = null;
    let jwtToken = null;
    let testAppointmentId = null;
    let testDoctorId = null;

    try {
        // 0. Clean up existing test database entries
        console.log('Cleaning up existing database records for test mobile...');
        await Patient.deleteOne({ mobile: testMobile });
        await Auth.deleteOne({ mobile: testMobile });
        await Auth.deleteOne({ email: 'creator@example.com' });
        await Auth.deleteOne({ email: 'doctor@example.com' });
        await Auth.deleteOne({ mobile: '910000000000' });
        await Auth.deleteOne({ mobile: '919999999999' });
        await Doctor.deleteMany({ name: 'Dr. Integration Tester' });
        await Hospital.deleteMany({ name: 'Integration Test Hospital' });
        console.log('Cleanup completed successfully.');

        // Seed Hospital & Doctor
        console.log('Seeding mock Hospital and Doctor records...');
        const creatorAuth = new Auth({
            firstName: 'Super',
            lastName: 'Admin',
            mobile: '910000000000',
            email: 'creator@example.com',
            password: 'CreatorPassword123!',
            role: 'super_admin'
        });
        await creatorAuth.save();

        const testHospital = new Hospital({
            hospitalName: 'Integration Test Hospital',
            description: 'A mock hospital for integration testing.',
            address: {
                street: '123 Health Ave',
                area: 'Green Park',
                city: 'New Delhi',
                state: 'Delhi',
                pincode: '110016'
            },
            location: {
                latitude: 28.5583,
                longitude: 77.2058
            },
            phone: '1122334455',
            email: 'hospital@example.com',
            contactDetails: {
                phone: '1122334455',
                email: 'hospital@example.com'
            },
            createdBy: creatorAuth._id
        });
        await testHospital.save();

        const doctorAuth = new Auth({
            firstName: 'Doctor',
            lastName: 'Tester',
            mobile: '919999999999',
            email: 'doctor@example.com',
            password: 'DoctorPassword123!',
            role: 'doctor'
        });
        await doctorAuth.save();

        const testDoctor = new Doctor({
            user: doctorAuth._id,
            hospital: testHospital._id,
            name: 'Dr. Integration Tester',
            specialization: 'Cardiology',
            consultationFee: 500
        });
        await testDoctor.save();
        testDoctorId = testDoctor._id;
        console.log('Hospital and Doctor seeded successfully.');

        // 1. Register Endpoint
        console.log('\n[TEST 1] Registering a new patient...');
        const registerRes = await fetch(`${baseUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: testName,
                mobile: testMobile,
                email: testEmail,
                password: testPassword,
                gender: 'female',
                bloodGroup: 'B+',
                address: {
                    street: '456 Main St',
                    city: 'New Delhi',
                    state: 'Delhi',
                    zipCode: '110001'
                }
            })
        });

        const registerData = await registerRes.json();
        console.log('Register Response Status:', registerRes.status);
        console.log('Register Response Data:', registerData);

        const patientId = registerData.patientId || registerData.patient?._id;
        if (registerRes.status !== 201 || !patientId) {
            throw new Error('Registration failed');
        }
        testPatientId = patientId;
        console.log('✓ Registration Test Passed!');

        // 2. Fetch OTP from DB to bypass SMS requirement
        console.log('\n[DB QUERY] Retrieving OTP from MongoDB...');
        const patientRecord = await Patient.findById(testPatientId);
        const storedOtp = patientRecord.otp;
        console.log(`Retrieved OTP for validation: ${storedOtp}`);

        if (!storedOtp) {
            throw new Error('OTP was not generated or saved to database');
        }

        // 3. Verify OTP Endpoint
        console.log('\n[TEST 2] Verifying OTP...');
        const verifyRes = await fetch(`${baseUrl}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patientId: testPatientId,
                otp: storedOtp
            })
        });

        const verifyData = await verifyRes.json();
        console.log('Verify OTP Response Status:', verifyRes.status);
        console.log('Verify OTP Response Data:', verifyData);

        if (verifyRes.status !== 200) {
            throw new Error('OTP Verification failed');
        }
        console.log('✓ OTP Verification Test Passed!');

        // 4. Login Endpoint
        console.log('\n[TEST 3] Logging in...');
        const loginRes = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mobile: testMobile,
                password: testPassword
            })
        });

        const loginData = await loginRes.json();
        console.log('Login Response Status:', loginRes.status);
        console.log('Login Response Token Received:', !!loginData.token);

        if (loginRes.status !== 200 || !loginData.token) {
            throw new Error('Login failed');
        }
        jwtToken = loginData.token;
        console.log('✓ Login Test Passed!');

        // 5. Get Profile Endpoint
        console.log('\n[TEST 4] Retrieving Profile...');
        const profileRes = await fetch(`${baseUrl}/profile`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json' 
            }
        });

        const profileData = await profileRes.json();
        console.log('Get Profile Response Status:', profileRes.status);
        console.log('Profile Details:', {
            name: profileData.name,
            mobile: profileData.mobile,
            isVerified: profileData.isVerified,
            role: profileData.role
        });

        if (profileRes.status !== 200 || profileData.mobile !== testMobile) {
            throw new Error('Profile retrieval failed');
        }
        console.log('✓ Profile Retrieval Test Passed!');

        // 6. Update Profile Endpoint
        console.log('\n[TEST 5] Updating Profile...');
        const updateRes = await fetch(`${baseUrl}/profile`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                name: 'Jane Updated Name',
                bloodGroup: 'B-'
            })
        });

        const updateData = await updateRes.json();
        console.log('Update Profile Response Status:', updateRes.status);
        console.log('Updated Profile Details Name:', updateData.patient?.name);

        if (updateRes.status !== 200 || updateData.patient?.name !== 'Jane Updated Name') {
            throw new Error('Profile update failed');
        }
        console.log('✓ Profile Update Test Passed!');

        // Mock Doctor ObjectId for testing appointment booking
        const mockDoctorId = new mongoose.Types.ObjectId();

        // 7. Book Appointment Endpoint
        console.log('\n[TEST 6] Booking an appointment...');
        const bookRes = await fetch(`${baseUrl}/appointments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                doctor: testDoctorId.toString(),
                date: new Date(Date.now() + 86400000).toISOString(), // tomorrow
                slot: '11:00 AM - 11:30 AM',
                type: 'video'
            })
        });

        const bookData = await bookRes.json();
        console.log('Book Appointment Response Status:', bookRes.status);
        console.log('Book Appointment Details:', bookData);

        if (bookRes.status !== 201 || !bookData.appointment?._id) {
            throw new Error('Appointment booking failed');
        }
        testAppointmentId = bookData.appointment._id;
        console.log('✓ Appointment Booking Test Passed!');

        // 8. Cancel Appointment Endpoint
        console.log('\n[TEST 7] Cancelling the appointment...');
        const cancelRes = await fetch(`${baseUrl}/appointments/${testAppointmentId}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json'
            }
        });

        const cancelData = await cancelRes.json();
        console.log('Cancel Appointment Response Status:', cancelRes.status);
        console.log('Cancel Appointment Response Data:', cancelData);

        if (cancelRes.status !== 200) {
            throw new Error('Appointment cancellation failed');
        }
        console.log('✓ Appointment Cancellation Test Passed!');

        // 9. Forgot Password Endpoint
        console.log('\n[TEST 8] Requesting Forgot Password OTP...');
        const forgotRes = await fetch(`${baseUrl}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: testMobile })
        });

        const forgotData = await forgotRes.json();
        console.log('Forgot Password Response Status:', forgotRes.status);
        console.log('Forgot Password Response Data:', forgotData);

        if (forgotRes.status !== 200 || !forgotData.patientId) {
            throw new Error('Forgot password request failed');
        }
        console.log('✓ Forgot Password Request Passed!');

        // Fetch new OTP from DB
        const updatedPatientRecord = await Patient.findById(testPatientId);
        const resetOtp = updatedPatientRecord.otp;
        console.log(`Retrieved Reset OTP: ${resetOtp}`);

        // 10. Reset Password Endpoint
        console.log('\n[TEST 9] Resetting Password...');
        const resetRes = await fetch(`${baseUrl}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patientId: testPatientId,
                otp: resetOtp,
                newPassword: 'BrandNewPassword789!'
            })
        });

        const resetData = await resetRes.json();
        console.log('Reset Password Response Status:', resetRes.status);
        console.log('Reset Password Response Data:', resetData);

        if (resetRes.status !== 200) {
            throw new Error('Password reset failed');
        }
        console.log('✓ Password Reset Test Passed!');

        console.log('\n======================================================');
        console.log('ALL MAIN INTEGRATION TESTS PASSED SUCCESSFULLY!');
        console.log('======================================================\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        process.exit(1);
    }
}

runTests();
