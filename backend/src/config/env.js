require('dotenv').config();

const getEnv = (key, fallback = undefined) => {
    const val = process.env[key];
    if (val !== undefined && val !== '') {
        return val;
    }
    return fallback;
};

const nodeEnv = getEnv('NODE_ENV', 'development');
const isProduction = nodeEnv === 'production';

const config = {
    port: getEnv('PORT', 5000),
    dbUri: getEnv('MONGODB_URI', isProduction ? undefined : 'mongodb://localhost:27017/hms-db'),
    jwtSecret: getEnv('JWT_SECRET'),
    jwtRefreshSecret: getEnv('JWT_REFRESH_SECRET'),
    nodeEnv,
    superAdminSecret: getEnv('SUPER_ADMIN_SECRET'),
    razorpayKeyId: getEnv('RAZORPAY_KEY_ID') || getEnv('RAZORPAY_KEY', ''),
    razorpayKeySecret: getEnv('RAZORPAY_KEY_SECRET') || getEnv('RAZORPAY_SECRET', ''),
    razorpayWebhookSecret: getEnv('RAZORPAY_WEBHOOK_SECRET', ''),
    smtpHost: getEnv('SMTP_HOST', ''),
    smtpPort: getEnv('SMTP_PORT', 587),
    smtpUser: getEnv('SMTP_USER', ''),
    smtpPass: getEnv('SMTP_PASS') || getEnv('SMTP_PASSWORD', ''),
    cloudinaryCloudName: getEnv('CLOUDINARY_CLOUD_NAME', ''),
    cloudinaryApiKey: getEnv('CLOUDINARY_API_KEY', ''),
    cloudinaryApiSecret: getEnv('CLOUDINARY_API_SECRET', ''),
    twilioAccountSid: getEnv('TWILIO_ACCOUNT_SID') || getEnv('TWILIO_SID', ''),
    twilioAuthToken: getEnv('TWILIO_AUTH_TOKEN') || getEnv('TWILIO_TOKEN', ''),
    twilioFromPhone: getEnv('TWILIO_FROM_PHONE') || getEnv('TWILIO_PHONE', '')
};

if (nodeEnv !== 'test') {
    const missing = [];
    if (!config.jwtSecret) missing.push('JWT_SECRET');
    if (!config.jwtRefreshSecret) missing.push('JWT_REFRESH_SECRET');
    if (!config.superAdminSecret) missing.push('SUPER_ADMIN_SECRET');

    if (missing.length > 0) {
        if (isProduction) {
            throw new Error(`CRITICAL CONFIGURATION ERROR: Missing required environment variables: ${missing.join(', ')}`);
        } else {
            console.warn(`[WARNING] Missing recommended environment variables: ${missing.join(', ')}. Please configure them in your .env file.`);
        }
    }
}

module.exports = config;
