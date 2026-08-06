require('dotenv').config();
const mongoose = require('mongoose');
const BedAllocation = require('./src/modules/ward/models/bedAllocation.model');
const Patient = require('./src/modules/patient/patient.model');
const Ward = require('./src/modules/ward/models/ward.model');

const runCleanup = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB. Starting cleanup...');

        const activeAllocations = await BedAllocation.find({
            status: { $in: ['Admitted', 'Discharge Requested'] }
        });

        console.log(`Found ${activeAllocations.length} active bed allocations.`);
        let ghostCount = 0;

        for (const allocation of activeAllocations) {
            const patient = await Patient.findById(allocation.patient);
            
            // If patient doesn't exist (hard deleted) OR is soft-deleted
            if (!patient || patient.isDeleted) {
                console.log(`Ghost allocation found: ID ${allocation._id}, Patient ${allocation.patient}. Discharging...`);
                
                allocation.status = 'Discharged';
                allocation.dischargeDate = new Date();
                
                // Keep patientName from original if not already populated
                if (!allocation.patientName) {
                    allocation.patientName = 'Unknown (Deleted)';
                }

                await allocation.save();

                const ward = await Ward.findById(allocation.ward);
                if (ward) {
                    ward.availableBeds += 1;
                    await ward.save();
                }
                ghostCount++;
            }
        }

        console.log(`Cleanup complete. Released ${ghostCount} ghost beds.`);
        process.exit(0);
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
};

runCleanup();
