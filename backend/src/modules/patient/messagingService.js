const twilio = require('twilio');

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
    if (formatted.startsWith('91') && formatted.length === 12) {
        return `+${formatted}`;
    }
    return `+91${formatted}`;
};

/**
 * Sends a plain SMS via Twilio
 * @param {string} mobile 
 * @param {string} message 
 * @returns {Promise<object>}
 */
const sendSMS = async (mobile, message) => {
    const formattedMobile = formatIndianMobile(mobile);

    console.log(`\n======================================================`);
    console.log(`[SMS SENT] To: ${formattedMobile}`);
    console.log(`Message: "${message}"`);
    console.log(`======================================================\n`);

    const accountSid = process.env.TWILIO_SID;
    const authToken = process.env.TWILIO_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE;

    if (!accountSid || !authToken || accountSid.startsWith('ACxxx') || authToken.includes('your_auth_token')) {
        console.log(`[Twilio Bypass] Placeholder credentials found. SMS logged to console.`);
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
        console.error(`[Twilio SMS Error] Failed to send SMS: ${err.message}`);
        return { success: false, error: err.message };
    }
};

/**
 * Sends a WhatsApp message via Twilio WhatsApp sandbox
 * @param {string} mobile 
 * @param {string} message 
 * @returns {Promise<object>}
 */
const sendWhatsApp = async (mobile, message) => {
    const formattedMobile = formatIndianMobile(mobile);
    const whatsappTo = `whatsapp:${formattedMobile}`;

    console.log(`\n======================================================`);
    console.log(`[WHATSAPP SENT] To: ${whatsappTo}`);
    console.log(`Message: "${message}"`);
    console.log(`======================================================\n`);

    const accountSid = process.env.TWILIO_SID;
    const authToken = process.env.TWILIO_TOKEN;
    const fromWhatsApp = process.env.TWILIO_WHATSAPP || 'whatsapp:+14155238886'; // default Twilio sandbox number

    // Ensure Twilio WhatsApp sender prefix matches whatsapp:
    const formattedFromWhatsApp = fromWhatsApp.startsWith('whatsapp:') ? fromWhatsApp : `whatsapp:${fromWhatsApp}`;

    if (!accountSid || !authToken || accountSid.startsWith('ACxxx') || authToken.includes('your_auth_token')) {
        console.log(`[Twilio Bypass] Placeholder credentials found. WhatsApp logged to console.`);
        return { success: true, logged: true };
    }

    try {
        const client = twilio(accountSid, authToken);
        const response = await client.messages.create({
            body: message,
            from: formattedFromWhatsApp,
            to: whatsappTo
        });
        return { success: true, sid: response.sid };
    } catch (err) {
        console.error(`[Twilio WhatsApp Error] Failed to send WhatsApp: ${err.message}`);
        return { success: false, error: err.message };
    }
};

module.exports = {
    sendSMS,
    sendWhatsApp
};
