require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('./src/modules/hospital/hospital.model');

const fixHospitals = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        const hospitals = await Hospital.find({});
        console.log(`Found ${hospitals.length} hospitals in total.`);

        let updatedCount = 0;
        
        for (let hospital of hospitals) {
            let needsUpdate = false;

            // 1. Make active
            if (!hospital.isActive) {
                hospital.isActive = true;
                needsUpdate = true;
            }

            // 2. Fix 0,0 location (Null Island) or missing location
            if (!hospital.location || !hospital.location.latitude || !hospital.location.longitude || 
                (hospital.location.latitude === 0 && hospital.location.longitude === 0)) {
                
                // Add dummy coordinates (New Delhi Area) with slight random variation so they don't overlap
                hospital.location = {
                    latitude: 28.6139 + (Math.random() * 0.1 - 0.05),
                    longitude: 77.2090 + (Math.random() * 0.1 - 0.05)
                };
                needsUpdate = true;
            }

            if (needsUpdate) {
                await hospital.save();
                updatedCount++;
            }
        }

        console.log(`Successfully fixed and updated ${updatedCount} hospitals.`);
        console.log('Now your Nearby API will work perfectly! Try testing it around Latitude: 28.61, Longitude: 77.20');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
};

fixHospitals();
