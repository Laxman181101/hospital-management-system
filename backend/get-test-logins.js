const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const Auth = require('./src/modules/auth/auth.model');

async function getLogins() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const salt = await bcrypt.genSalt(10);
        const newPassword = await bcrypt.hash('Password123', salt);

        const roles = ['hospital_admin', 'pharmacist', 'doctor', 'patient'];
        const accounts = {};

        for (let role of roles) {
            let user = await Auth.findOne({ role });
            if (!user) {
                // create a mock one if missing
                user = await Auth.create({
                    firstName: "Test",
                    lastName: role,
                    email: `test_${role}@example.com`,
                    mobile: "1234567" + Math.floor(Math.random() * 1000),
                    password: newPassword,
                    role: role,
                    isApproved: true
                });
            } else {
                user.password = newPassword;
                await user.save();
            }
            accounts[role] = user.email;
        }

        console.log("LOGIN_DETAILS_JSON:", JSON.stringify(accounts));
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
}
getLogins();
