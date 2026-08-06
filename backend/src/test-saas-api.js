process.env.PORT = 5004; // Run SaaS tests on port 5004
require('dotenv').config();

const mongoose = require('mongoose');
const Hospital = require('./modules/hospital/hospital.model');
const Doctor = require('./modules/doctor/doctor.model');
const Auth = require('./modules/auth/auth.model');
const Appointment = require('./modules/appointment/appointment.model');
const Leave = require('./modules/staff-leave/leave.model');
const Attendance = require('./modules/attendance/attendance.model');
const Patient = require('./modules/patient/patient.model');

const baseUrl = 'http://localhost:5004/api/v1';

// Helper to delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runSaaSTests() {
    console.log('\n======================================================');
    console.log('STARTING SAAS LEVEL MULTI-TENANT CONFIGURATION TESTS');
    console.log('======================================================\n');

    // Start Express server
    const serverFile = require('../server');
    await sleep(4000); // wait for DB connect

    let testHospitalId = null;
    let testDoctorId = null;
    let testDoctorUserId = null;
    let testPatientUserId = null;
    let testPatientId = null;
    let patientJwtToken = null;

    try {
        console.log('Cleaning up existing SaaS records...');
        await Hospital.deleteMany({ hospitalName: 'SaaS Test Clinic' });
        await Doctor.deleteMany({ name: 'Dr. SaaS Specialist' });
        await Auth.deleteMany({ email: { $in: ['saas_admin@example.com', 'saas_doc@example.com', 'saas_patient@example.com'] } });
        await Leave.deleteMany({});
        await Attendance.deleteMany({});
        console.log('Cleanup complete.\n');

        console.log('[STEP 1] Seeding Hospital and Doctor with custom settings...');
        const adminAuth = new Auth({
            firstName: 'SaaS Admin',
            mobile: '910000000001',
            email: 'saas_admin@example.com',
            password: 'AdminPassword123!',
            role: 'hospital_admin'
        });
        await adminAuth.save();

        const hospital = new Hospital({
            hospitalName: 'SaaS Test Clinic',
            description: 'A custom clinic for SaaS validations',
            email: 'saas_admin@example.com',
            phone: '910000000001',
            address: {
                street: '123 SaaS Way',
                area: 'SaaS Tech Park',
                city: 'Bengaluru',
                state: 'Karnataka',
                pincode: '560001'
            },
            location: {
                latitude: 12.9716,
                longitude: 77.5946
            },
            createdBy: adminAuth._id,
            settings: {
                slotDurationMinutes: 20, // 20-minute slots
                supportedConsultations: ['physical', 'video'] // NO audio call allowed
            }
        });
        await hospital.save();
        testHospitalId = hospital._id;

        const docAuth = new Auth({
            firstName: 'SaaS Doctor',
            mobile: '910000000002',
            email: 'saas_doc@example.com',
            password: 'DoctorPassword123!',
            role: 'doctor',
            hospitalId: testHospitalId,
            isApproved: true
        });
        await docAuth.save();
        testDoctorUserId = docAuth._id;

        const doctor = new Doctor({
            user: docAuth._id,
            hospital: testHospitalId,
            name: 'Dr. SaaS Specialist',
            specialization: 'Cardiology',
            consultationFee: 1000,
            availabilitySchedule: [
                {
                    day: 'Monday',
                    startTime: '09:00 AM',
                    endTime: '12:00 PM'
                },
                {
                    day: 'Tuesday',
                    startTime: '09:00 AM',
                    endTime: '12:00 PM'
                },
                {
                    day: 'Wednesday',
                    startTime: '09:00 AM',
                    endTime: '12:00 PM'
                },
                {
                    day: 'Thursday',
                    startTime: '09:00 AM',
                    endTime: '12:00 PM'
                },
                {
                    day: 'Friday',
                    startTime: '09:00 AM',
                    endTime: '12:00 PM'
                },
                {
                    day: 'Saturday',
                    startTime: '09:00 AM',
                    endTime: '12:00 PM'
                },
                {
                    day: 'Sunday',
                    startTime: '09:00 AM',
                    endTime: '12:00 PM'
                }
            ],
            consultationModes: ['physical'] // Only physical checkup configured by default (No video!)
        });
        await doctor.save();
        testDoctorId = doctor._id;

        console.log('✓ Seeding complete. Hospital uses 20m slots, Doctor supports physical-only.\n');

        // Create Patient and get Token
        const patientAuth = new Auth({
            firstName: 'SaaS Patient',
            mobile: '910000000003',
            email: 'saas_patient@example.com',
            password: 'PatientPassword123!',
            role: 'patient',
            isApproved: true
        });
        await patientAuth.save();
        testPatientUserId = patientAuth._id;

        const patient = new Patient({
            user: patientAuth._id,
            hospitalId: testHospitalId,
            name: 'SaaS Patient',
            firstName: 'SaaS',
            lastName: 'Patient',
            mobile: '910000000003',
            email: 'saas_patient@example.com',
            password: patientAuth.password,
            isVerified: true
        });
        await patient.save();
        testPatientId = patient._id;

        // Login patient
        const jwt = require('jsonwebtoken');
        patientJwtToken = jwt.sign(
            { sub: patientAuth._id, role: 'patient' },
            process.env.JWT_SECRET || 'superSecretKeyForHospitalManagementSystem123!',
            { expiresIn: '1d' }
        );

        // --- TEST A: Dynamic Slot Durations ---
        console.log('[TEST A] Fetching dynamic slots (should have 20-minute interval intervals)...');
        // Let's use a fixed weekday, e.g. a Monday
        const testDate = new Date('2026-07-06'); // Monday
        const slotsRes = await fetch(`${baseUrl}/appointments/slots?doctorId=${testDoctorId}&date=${testDate.toISOString()}`, {
            headers: { 'Authorization': `Bearer ${patientJwtToken}` }
        });
        const slotsData = await slotsRes.json();
        
        console.log('Status code:', slotsRes.status);
        console.log('Generated time slots:', slotsData.data?.slots?.map(s => s.slot));
        if (slotsRes.status !== 200 || !slotsData.data?.slots || slotsData.data.slots.length !== 9) {
            throw new Error('SaaS Slot generator failed: incorrect count of 20m slots');
        }
        console.log('✓ TEST A Passed! 9 slots generated (09:00 AM - 12:00 PM in 20m increments)\n');

        // --- TEST B: Booking Validation (Doctor level disabled) ---
        console.log('[TEST B] Booking video appointment (supported by hospital but disabled by doctor)...');
        const bookRes1 = await fetch(`${baseUrl}/appointments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${patientJwtToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                doctor: testDoctorId,
                patient: testPatientId,
                hospital: testHospitalId,
                appointmentDate: testDate.toISOString(),
                startTime: '09:00 AM',
                endTime: '09:20 AM',
                appointmentType: 'video' // Video is not supported by this doctor!
            })
        });

        const bookData1 = await bookRes1.json();
        console.log('Booking response status:', bookRes1.status);
        console.log('Booking response message:', bookData1.message);
        if (bookRes1.status !== 400 || !bookData1.message.includes('does not support video')) {
            throw new Error('TEST B Failed: Video booking should have been rejected');
        }
        console.log('✓ TEST B Passed! Video booking rejected properly.\n');

        // --- TEST C: Booking Validation (Hospital level disabled) ---
        console.log('[TEST C] Booking audio appointment (disabled by hospital settings)...');
        // Let's first enable audio on doctor, but keep it disabled on hospital settings
        doctor.consultationModes = ['physical', 'audio'];
        await doctor.save();

        const bookRes2 = await fetch(`${baseUrl}/appointments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${patientJwtToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                doctor: testDoctorId,
                patient: testPatientId,
                hospital: testHospitalId,
                appointmentDate: testDate.toISOString(),
                startTime: '09:00 AM',
                endTime: '09:20 AM',
                appointmentType: 'audio' // Audio is disabled by hospital
            })
        });

        const bookData2 = await bookRes2.json();
        console.log('Booking response status:', bookRes2.status);
        console.log('Booking response message:', bookData2.message);
        if (bookRes2.status !== 400 || !bookData2.message.includes('Hospital does not support audio')) {
            throw new Error('TEST C Failed: Audio booking should have been rejected by Hospital Settings');
        }
        console.log('✓ TEST C Passed! Audio booking rejected by Hospital settings properly.\n');

        // --- TEST D: Staff Leaves Blocking slots ---
        console.log('[TEST D] Applying Leave for doctor and checking slots availability...');
        const leave = new Leave({
            staff: testDoctorUserId,
            hospital: testHospitalId,
            startDate: new Date('2026-07-06T00:00:00.000Z'),
            endDate: new Date('2026-07-06T23:59:59.000Z'),
            leaveType: 'sick',
            status: 'approved'
        });
        await leave.save();

        const leaveSlotsRes = await fetch(`${baseUrl}/appointments/slots?doctorId=${testDoctorId}&date=${testDate.toISOString()}`, {
            headers: { 'Authorization': `Bearer ${patientJwtToken}` }
        });
        const leaveSlotsData = await leaveSlotsRes.json();
        console.log('Slots search availability:', leaveSlotsData.data?.available);
        console.log('Slots search message:', leaveSlotsData.data?.message);
        if (leaveSlotsRes.status !== 200 || leaveSlotsData.data.available !== false || leaveSlotsData.data.status !== 'on_leave') {
            throw new Error('TEST D Failed: Doctor leaves did not block slots availability');
        }

        // Try booking on a leave day
        const bookRes3 = await fetch(`${baseUrl}/appointments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${patientJwtToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                doctor: testDoctorId,
                patient: testPatientId,
                hospital: testHospitalId,
                appointmentDate: testDate.toISOString(),
                startTime: '09:00 AM',
                endTime: '09:20 AM',
                appointmentType: 'physical'
            })
        });
        const bookData3 = await bookRes3.json();
        console.log('Booking attempt status on leave day:', bookRes3.status);
        console.log('Booking attempt message:', bookData3.message);
        if (bookRes3.status !== 400 || !bookData3.message.includes('Doctor is on leave')) {
            throw new Error('TEST D Failed: Should prevent booking on a leave day');
        }
        console.log('✓ TEST D Passed! Leaves successfully blocked slot queries and booking requests.\n');

        // Clean up leave for attendance tests
        await Leave.deleteMany({});

        // --- TEST E: Attendance Delay Slot Shifting ---
        console.log('[TEST E] Marking Doctor 40 minutes late and checking slots...');
        const attendance = new Attendance({
            staff: testDoctorUserId,
            hospital: testHospitalId,
            date: testDate,
            status: 'late',
            delayMinutes: 40,
            reportedBy: 'self'
        });
        await attendance.save();

        const lateSlotsRes = await fetch(`${baseUrl}/appointments/slots?doctorId=${testDoctorId}&date=${testDate.toISOString()}`, {
            headers: { 'Authorization': `Bearer ${patientJwtToken}` }
        });
        const lateSlotsData = await lateSlotsRes.json();
        console.log('Delay status:', lateSlotsData.data?.status);
        console.log('Delay minutes:', lateSlotsData.data?.delayMinutes);
        console.log('Delayed slots generated:', lateSlotsData.data?.slots?.map(s => s.slot));

        if (lateSlotsRes.status !== 200 || !lateSlotsData.data?.slots || lateSlotsData.data.slots[0].startTime !== '09:40 AM') {
            throw new Error('TEST E Failed: Doctor late arrival did not shift starting slot time to 09:40 AM');
        }
        console.log('✓ TEST E Passed! Time slots shifted successfully by 40 minutes.\n');

        console.log('======================================================');
        console.log('ALL SAAS MULTI-TENANT CONFIGURATION TESTS PASSED!');
        console.log('======================================================\n');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ SAAS TEST FAILED:', err.message);
        process.exit(1);
    }
}

runSaaSTests();
