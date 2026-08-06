require('dotenv').config();

module.exports = {
    port: process.env.PORT || 5000,
    dbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/hms-db',
    jwtSecret: process.env.JWT_SECRET || 'secretKey',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'refreshSecretKey',
    nodeEnv: process.env.NODE_ENV || 'development',
    superAdminSecret: process.env.SUPER_ADMIN_SECRET || 'fallback_secret',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_StJNpcucdPt8Ja',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'LfVmWXkO6fcuK8G41J9pqumy',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: process.env.SMTP_PORT || 587,
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || ''
};
// Trigger nodemon restart
