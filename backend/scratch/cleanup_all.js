require('dotenv').config();
const mongoose = require('mongoose');
const AdmissionRequest = require('../src/modules/ward/models/admissionRequest.model');
const BedAllocation = require('../src/modules/ward/models/bedAllocation.model');
const Patient = require('../src/modules/patient/patient.model');
const Ward = require('../src/modules/ward/models/ward.model');

const cleanupAll = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // 1. Clean up Admission Requests
        const activeRequests = await AdmissionRequest.find({ status: 'Pending' });
        let reqGhostCount = 0;

        for (const req of activeRequests) {
            const patient = await Patient.findById(req.patient);
            if (!patient || patient.isDeleted) {
                console.log(`Ghost admission request found: ID ${req._id}. Cancelling...`);
                req.status = 'Cancelled';
                await req.save();
                reqGhostCount++;
            }
        }
        console.log(`Cleaned up ${reqGhostCount} ghost admission requests.`);

        // 2. Clean up Bed Allocations again
        const activeAllocations = await BedAllocation.find({ status: { $in: ['Admitted', 'Discharge Requested'] } });
        let allocGhostCount = 0;

        for (const alloc of activeAllocations) {
            const patient = await Patient.findById(alloc.patient);
            if (!patient || patient.isDeleted) {
                console.log(`Ghost bed allocation found: ID ${alloc._id}. Discharging...`);
                alloc.status = 'Discharged';
                alloc.dischargeDate = new Date();
                if (!alloc.patientName) alloc.patientName = 'Unknown (Deleted)';
                await alloc.save();

                const ward = await Ward.findById(alloc.ward);
                if (ward) {
                    ward.availableBeds += 1;
                    await ward.save();
                }
                allocGhostCount++;
            }
        }
        console.log(`Cleaned up ${allocGhostCount} ghost bed allocations.`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

cleanupAll();
