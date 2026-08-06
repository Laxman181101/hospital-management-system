const mongoose = require('mongoose');
const User = require('./src/modules/auth/auth.model');
const dotenv = require('dotenv');

dotenv.config();

const resetPasswords = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hms');

        const emails = ['oneadmin@gmail.com', 'admin_test@hospital.com'];
        for (const email of emails) {
            const user = await User.findOne({ email });
            if (user) {
                user.password = 'Password123'; // pre-save hook will hash this!
                await user.save();
                console.log(`Password for ${email} successfully reset to 'Password123'`);
            } else {
                console.log(`User ${email} not found.`);
            }
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.disconnect();
    }
};

resetPasswords();
