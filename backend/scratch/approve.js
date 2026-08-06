const mongoose = require('mongoose');
require('dotenv').config();
const Auth = require('../src/modules/auth/auth.model');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('Connected to DB');
    const user = await Auth.findOne({ email: 'john2@apollocare.com' });
    if (user) {
        user.isApproved = true;
        await user.save();
        console.log('Approved john2@apollocare.com');
    } else {
        console.log('User not found');
    }
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
