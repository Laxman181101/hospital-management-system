const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const Auth = require('./src/modules/auth/auth.model');

async function resetAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        let admin = await Auth.findOne({ role: 'super_admin' });
        if (admin) {
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash('mySecurePassword', salt);
            await admin.save();
            console.log("Password reset back to 'mySecurePassword'");
        }
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
}
resetAdmin();
