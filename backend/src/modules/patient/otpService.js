const twilio = require('twilio');

/**
 * Generates a 6-digit random number as a string
 * @returns {string}
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Formats a phone number with the +91 country prefix if needed
 * @param {string} mobile 
 * @returns {string}
 */
const formatIndianMobile = (mobile) => {
    let formatted = mobile.trim();
    if (formatted.startsWith('+')) {
        return formatted;
    }
    // If it starts with 91 and has 12 digits total
    if (formatted.startsWith('91') && formatted.length === 12) {
        return `+${formatted}`;
    }
    // Default to +91 prefix
    return `+91${formatted}`;
};

/**
 * Sends OTP via SMS using Twilio
 * @param {string} mobile 
 * @param {string} otp 
 * @returns {Promise<object>}
 */
const sendOTP = async (mobile, otp) => {
    const formattedMobile = formatIndianMobile(mobile);
    const message = `Your Hospital OTP is: ${otp}. Valid for 10 minutes.`;

    console.log(`\n======================================================`);
    console.log(`[SMS OTP SENT] To: ${formattedMobile}`);
    console.log(`Message: "${message}"`);
    console.log(`======================================================\n`);

    const accountSid = process.env.TWILIO_SID;
    const authToken = process.env.TWILIO_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE;

    // Fallback if credentials are unset or placeholders
    if (!accountSid || !authToken || accountSid.startsWith('ACxxx') || authToken.includes('your_auth_token')) {
        console.log(`[Twilio Bypass] Placeholder credentials found. OTP displayed in logs.`);
        return { success: true, logged: true };
    }

    try {
        const client = twilio(accountSid, authToken);
        const response = await client.messages.create({
            body: message,
            from: fromPhone,
            to: formattedMobile
        });
        return { success: true, sid: response.sid };
    } catch (err) {
        console.error(`[Twilio Send Error] Failed to send SMS via Twilio: ${err.message}`);
        // Let operation proceed with a fallback flag
        return { success: false, error: err.message };
    }
};

module.exports = {
    generateOTP,
    sendOTP
};
