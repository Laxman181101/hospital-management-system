const mongoose = require('mongoose');
require('dotenv').config();
const Auth = require('./src/modules/auth/auth.model');

async function fixLogins() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const roles = ['hospital_admin', 'pharmacist', 'doctor', 'patient'];

        for (let role of roles) {
            let user = await Auth.findOne({ role });
            if (user) {
                user.password = 'Password123';
                await user.save();
                console.log(`Reset ${role}: ${user.email}`);
            }
        }
        
        let superAdmin = await Auth.findOne({ role: 'super_admin' });
        if (superAdmin) {
            superAdmin.password = 'mySecurePassword';
            await superAdmin.save();
            console.log(`Reset super_admin: ${superAdmin.email}`);
        }
        
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
}
fixLogins();
