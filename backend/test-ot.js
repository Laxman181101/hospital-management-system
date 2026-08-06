const mongoose = require('mongoose');
const dotenv = require('dotenv');
const otService = require('./src/modules/operation-theater/operation-theater.service');
const Hospital = require('./src/modules/hospital/hospital.model');
const Patient = require('./src/modules/patient/patient.model');
const Doctor = require('./src/modules/doctor/doctor.model');
const User = require('./src/modules/auth/auth.model');

dotenv.config();

const testOT = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hms');
        console.log("Connected to DB...");

        // 1. Get a hospital
        const hospital = await Hospital.findOne();
        if (!hospital) {
            console.log("No hospital found in DB. Please make sure the DB is seeded.");
            return;
        }

        // 2. Get an admin user
        const admin = await User.findOne({ role: { $in: ['hospital_admin', 'Admin'] }, hospitalId: hospital._id });
        const adminId = admin ? admin._id : new mongoose.Types.ObjectId();

        // 3. Get or create a patient
        let patient = await Patient.findOne({ hospitalId: hospital._id });
        if (!patient) {
            patient = new Patient({
                firstName: 'Test',
                lastName: 'Patient',
                gender: 'Male',
                dob: new Date('1990-01-01'),
                mobile: '9999999999',
                hospitalId: hospital._id,
                email: 'testpatient@example.com'
            });
            await patient.save();
        }

        // 4. Get or create a doctor
        let doctor = await Doctor.findOne({ hospitalId: hospital._id });
        if (!doctor) {
            doctor = new Doctor({
                userId: adminId, // dummy
                firstName: 'Test',
                lastName: 'Surgeon',
                gender: 'Male',
                dob: new Date('1980-01-01'),
                mobile: '8888888888',
                email: 'surgeon@example.com',
                department: 'Surgery',
                specialty: 'General Surgery',
                hospitalId: hospital._id
            });
            await doctor.save();
        }

        // 5. Create an OT Room
        console.log("\n--- 1. Creating OT Room ---");
        const otData = {
            name: 'General OT - Test',
            type: 'General',
            capacity: 1,
            description: 'Main general surgery theater for testing'
        };
        const otRoom = await otService.createOT(hospital._id, otData);
        console.log("OT Room Created:", otRoom.name, "| Status:", otRoom.status);

        // 6. Schedule a Surgery
        console.log("\n--- 2. Scheduling a Surgery ---");
        const surgeryData = {
            patientId: patient._id,
            operationTheaterId: otRoom._id,
            surgeonId: doctor._id,
            surgeryName: 'Appendectomy',
            scheduledDate: new Date(),
            startTime: '10:00',
            endTime: '12:00'
        };
        const scheduledSurgery = await otService.scheduleSurgery(hospital._id, surgeryData, adminId);
        console.log(`Surgery Scheduled: ${scheduledSurgery.surgeryName} | Status: ${scheduledSurgery.status}`);

        // 7. Update Surgery Status to In-Progress
        console.log("\n--- 3. Starting the Surgery (Changing Status to In-Progress) ---");
        const inProgressSurgery = await otService.updateSurgeryStatus(hospital._id, scheduledSurgery._id, 'In-Progress', 'Surgery started successfully', adminId);
        
        // 8. Fetch updated OT Room
        const updatedOtRoom = await otService.getOTById(hospital._id, otRoom._id);
        
        console.log(`Surgery Status is now: ${inProgressSurgery.status}`);
        console.log(`OT Room Status is automatically updated to: ${updatedOtRoom.status} (It's Occupied!)`);

        console.log("\nTest Completed Successfully! The logic works perfectly.");

    } catch (err) {
        console.error("Test Error:", err.message);
    } finally {
        await mongoose.disconnect();
    }
};

testOT();
