process.env.PORT = 5003; // Run tests on port 5003
require('dotenv').config();

const mongoose = require('mongoose');
const Patient = require('./modules/patient/patient.model');
const Appointment = require('./modules/appointment/appointment.model');
const Auth = require('./modules/auth/auth.model');
const Hospital = require('./modules/hospital/hospital.model');
const Doctor = require('./modules/doctor/doctor.model');
const Payment = require('./modules/payment/payment.model');
const Invoice = require('./modules/payment/invoice.model');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const testMobile = '916666666666';
const testPassword = 'PaymentPassword123!';
const testEmail = 'paymentpatient@example.com';
const testName = 'John Payment Tester';

const baseUrl = 'http://localhost:5003/api/payments';

// Helper to delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
    console.log('\n======================================================');
    console.log('STARTING BILLING & PAYMENT MODULE INTEGRATION TESTS');
    console.log('======================================================\n');

    // Require and start the main server
    console.log('Booting up the Express server on port 5003...');
    const serverFile = require('../server');

    // Wait 4 seconds for DB connection and server to start listening
    await sleep(4000);

    let testPatientId = null;
    let jwtToken = null;
    let adminToken = null;
    let testAppointmentId = null;
    let testDoctorId = null;
    let testPaymentId = null;
    let testOrderId = null;
    let testInvoiceId = null;

    try {
        // 0. Clean up existing test database entries
        console.log('Cleaning up existing database records...');
        await Patient.deleteOne({ mobile: testMobile });
        await Auth.deleteOne({ mobile: testMobile });
        await Auth.deleteOne({ email: 'admin_payment@example.com' });
        await Auth.deleteOne({ email: 'doctor_payment@example.com' });
        await Doctor.deleteMany({ name: 'Dr. Payment Tester' });
        await Hospital.deleteMany({ name: 'Payment Test Hospital' });
        await Payment.deleteMany({ amount: 750 });
        await Invoice.deleteMany({ totalAmount: 750 });
        console.log('Cleanup completed successfully.');

        // Seed Hospital, Doctor, and Admin Auth
        console.log('Seeding mock Hospital, Doctor, and Admin records...');
        const adminAuth = new Auth({
            firstName: 'Admin',
            mobile: '9999999991',
            email: 'admin_payment@example.com',
            password: 'AdminPassword123!',
            role: 'hospital_admin'
        });
        await adminAuth.save();

        const testHospital = new Hospital({
            name: 'Payment Test Hospital',
            hospitalName: 'Payment Test Hospital',
            description: 'A mock hospital for payment integration tests',
            email: 'paymenthospital@example.com',
            phone: '9988776655',
            address: {
                street: '789 Coins Blvd',
                area: 'Gomti Nagar',
                city: 'Lucknow',
                state: 'Uttar Pradesh',
                pincode: '226010'
            },
            location: {
                latitude: 26.8467,
                longitude: 80.9462
            },
            createdBy: adminAuth._id
        });
        await testHospital.save();

        const doctorAuth = new Auth({
            firstName: 'Doctor',
            mobile: '9999999992',
            email: 'doctor_payment@example.com',
            password: 'DoctorPassword123!',
            role: 'doctor'
        });
        await doctorAuth.save();

        const testDoctor = new Doctor({
            user: doctorAuth._id,
            hospital: testHospital._id,
            name: 'Dr. Payment Tester',
            specialization: 'Pediatrics',
            consultationFee: 750
        });
        await testDoctor.save();
        testDoctorId = testDoctor._id;
        console.log('Seeding completed.');

        // Login Admin to get token
        const jwt = require('jsonwebtoken');
        adminToken = jwt.sign(
            { id: adminAuth._id, role: 'hospital_admin' },
            process.env.JWT_SECRET || 'superSecretKeyForHospitalManagementSystem123!',
            { expiresIn: '1d' }
        );

        // 1. Register Patient
        console.log('\n[TEST 1] Registering and verifying a new patient...');
        const registerRes = await fetch('http://localhost:5003/api/v1/patients/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: testName,
                mobile: testMobile,
                email: testEmail,
                password: testPassword,
                gender: 'male',
                bloodGroup: 'A+',
                address: { street: '123 Pay St', city: 'Lucknow', state: 'UP', zipCode: '226001' }
            })
        });

        const registerData = await registerRes.json();
        const patientId = registerData.patientId || registerData.patient?._id;
        if (registerRes.status !== 201 || !patientId) {
            throw new Error('Registration failed: ' + JSON.stringify(registerData));
        }
        testPatientId = patientId;

        // Verify OTP directly from DB
        const patientRecord = await Patient.findById(testPatientId);
        const verifyRes = await fetch('http://localhost:5003/api/v1/patients/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patientId: testPatientId,
                otp: patientRecord.otp
            })
        });
        if (verifyRes.status !== 200) {
            throw new Error('OTP Verification failed');
        }

        // Login patient
        const loginRes = await fetch('http://localhost:5003/api/v1/patients/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: testMobile, password: testPassword })
        });
        const loginData = await loginRes.json();
        jwtToken = loginData.token;
        console.log('✓ Patient Registered, Verified, and Logged in successfully!');

        // Book mock appointment directly
        const testAppointment = new Appointment({
            patient: testPatientId,
            doctor: testDoctorId,
            hospital: testHospital._id,
            date: new Date(Date.now() + 86400000), // tomorrow
            slot: '02:00 PM - 02:30 PM',
            type: 'physical',
            status: 'booked'
        });
        await testAppointment.save();
        testAppointmentId = testAppointment._id;
        console.log(`Mock Appointment created with ID: ${testAppointmentId}`);

        // 2. Create Order Endpoint
        console.log('\n[TEST 2] Creating Razorpay Order...');
        const orderRes = await fetch(`${baseUrl}/create-order`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                appointmentId: testAppointmentId.toString(),
                amount: 750
            })
        });

        const orderData = await orderRes.json();
        console.log('Create Order Response Status:', orderRes.status);
        console.log('Create Order Response Data:', orderData);

        if (orderRes.status !== 201 || !orderData.orderId) {
            throw new Error('Razorpay order creation failed');
        }
        testOrderId = orderData.orderId;
        testPaymentId = orderData.paymentId;
        console.log('✓ Create Order Test Passed!');

        // 3. Verify Payment Signature Endpoint
        console.log('\n[TEST 3] Verifying Payment Signature...');
        const razorpayPaymentId = 'pay_test_' + Math.random().toString(36).substring(2, 10);
        // Generate valid signature using HMAC
        const signatureBody = testOrderId + '|' + razorpayPaymentId;
        const razorpaySignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET || 'LfVmWXkO6fcuK8G41J9pqumy')
            .update(signatureBody)
            .digest('hex');

        const verifyPaymentRes = await fetch(`${baseUrl}/verify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                razorpayOrderId: testOrderId,
                razorpayPaymentId,
                razorpaySignature,
                paymentId: testPaymentId,
                appointmentId: testAppointmentId.toString()
            })
        });

        const verifyPaymentData = await verifyPaymentRes.json();
        console.log('Verify Payment Response Status:', verifyPaymentRes.status);
        console.log('Verify Payment Response Data:', verifyPaymentData);

        if (verifyPaymentRes.status !== 200 || !verifyPaymentData.receiptUrl) {
            throw new Error('Payment verification failed');
        }
        console.log('✓ Payment Signature Verification Test Passed!');

        // Fetch invoice ID from DB
        const invoiceRecord = await Invoice.findOne({ payment: testPaymentId });
        if (!invoiceRecord) {
            throw new Error('Invoice was not created in the database');
        }
        testInvoiceId = invoiceRecord._id;

        // Verify PDF Receipt exists on disk
        const pdfPath = path.join(__dirname, '../', verifyPaymentData.receiptUrl);
        console.log(`Checking PDF receipt at path: ${pdfPath}`);
        if (!fs.existsSync(pdfPath)) {
            throw new Error('PDF Receipt file was not created on disk');
        }
        console.log('✓ PDF Receipt file verified on disk!');

        // 4. Get Payment History (Patient)
        console.log('\n[TEST 4] Retrieving Patient Payment History...');
        const historyRes = await fetch(`${baseUrl}/history`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${jwtToken}` }
        });
        const historyData = await historyRes.json();
        console.log('History Status:', historyRes.status);
        console.log('Payments Count:', historyData.count);

        if (historyRes.status !== 200 || historyData.count === 0) {
            throw new Error('Patient payment history empty or failed');
        }
        console.log('✓ Patient Payment History Retrieval Passed!');

        // 5. Get Payment By ID
        console.log('\n[TEST 5] Fetching Single Payment details...');
        const singlePaymentRes = await fetch(`${baseUrl}/${testPaymentId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${jwtToken}` }
        });
        const singlePaymentData = await singlePaymentRes.json();
        console.log('Single Payment Status:', singlePaymentRes.status);
        console.log('Payment Amount in DB:', singlePaymentData.amount);

        if (singlePaymentRes.status !== 200 || singlePaymentData.amount !== 750) {
            throw new Error('Single payment fetch failed or amount mismatch');
        }
        console.log('✓ Single Payment Retrieval Passed!');

        // 6. Get Invoice By ID
        console.log('\n[TEST 6] Retrieving Invoice by ID...');
        const invoiceRes = await fetch(`${baseUrl}/invoice/${testInvoiceId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${jwtToken}` }
        });
        const invoiceData = await invoiceRes.json();
        console.log('Invoice Status:', invoiceRes.status);
        console.log('Invoice Number:', invoiceData.invoiceNumber);

        if (invoiceRes.status !== 200 || !invoiceData.invoiceNumber) {
            throw new Error('Invoice fetch failed');
        }
        console.log('✓ Invoice Retrieval Passed!');

        // 7. Get All Payments (Admin)
        console.log('\n[TEST 7] Retrieving Admin All Payments...');
        const adminAllRes = await fetch(`${baseUrl}/all`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const adminAllData = await adminAllRes.json();
        console.log('Admin All Payments Status:', adminAllRes.status);
        console.log('Admin Total Payments Count:', adminAllData.count);

        if (adminAllRes.status !== 200 || adminAllData.count === 0) {
            throw new Error('Admin payments fetch failed');
        }
        console.log('✓ Admin All Payments Retrieval Passed!');

        // 8. Get Revenue Stats (Admin)
        console.log('\n[TEST 8] Fetching Admin Revenue Statistics...');
        const statsRes = await fetch(`${baseUrl}/stats/revenue`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const statsData = await statsRes.json();
        console.log('Stats Status:', statsRes.status);
        console.log('Revenue Stats:', statsData);

        if (statsRes.status !== 200 || statsData.totalRevenue < 750) {
            throw new Error('Revenue statistics fetch failed or calculation incorrect');
        }
        console.log('✓ Admin Revenue Statistics Fetch Passed!');

        console.log('\n======================================================');
        console.log('ALL BILLING & PAYMENT MODULE TESTS PASSED SUCCESSFULLY!');
        console.log('======================================================\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        process.exit(1);
    }
}

runTests();
