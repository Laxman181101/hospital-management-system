require('dotenv').config();
const mongoose = require('mongoose');
const BedAllocation = require('../src/modules/ward/models/bedAllocation.model');
const Patient = require('../src/modules/patient/patient.model');

const checkAdmissions = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const allocations = await BedAllocation.find({ status: { $in: ['Admitted', 'Discharge Requested'] } })
            .populate({ path: 'patient', select: 'name firstName lastName' });

        console.log(`Found ${allocations.length} active allocations.`);
        for (const alloc of allocations) {
            console.log(`- Allocation ID: ${alloc._id}, Bed: ${alloc.bedNumber}`);
            if (alloc.patient) {
                console.log(`  Patient ID: ${alloc.patient._id}, Name: ${alloc.patient.name}, First: ${alloc.patient.firstName}, Last: ${alloc.patient.lastName}`);
            } else {
                console.log(`  Patient: null`);
            }
            console.log(`  Saved patientName: ${alloc.patientName}`);
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkAdmissions();
