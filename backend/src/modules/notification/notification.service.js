const axios = require('axios');
const env = require('../../config/env');

// Mock function to simulate SMS sending (Replace with Twilio/Fast2SMS later)
const sendSMS = async (mobile, message) => {
    console.log(`[SMS OUTBOX] To: ${mobile} | Message: ${message}`);
    // Example Twilio API call goes here
    return true;
};

// Function to send WhatsApp message via Meta Cloud API
const sendWhatsApp = async (mobile, message) => {
    console.log(`[WHATSAPP OUTBOX] To: ${mobile} | Message: ${message}`);
    
    // If you add WHATSAPP_TOKEN to .env later, this code will automatically work
    if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID) {
        try {
            await axios.post(
                `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: mobile,
                    type: 'text',
                    text: { body: message }
                },
                {
                    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }
                }
            );
        } catch (error) {
            console.error('[WHATSAPP ERROR]', error.response?.data || error.message);
        }
    }
    
    return true;
};

// Central routing function
const sendMessage = async (mobile, message, channel = 'whatsapp') => {
    if (!mobile) return false;
    
    if (channel === 'sms') {
        return await sendSMS(mobile, message);
    } else {
        return await sendWhatsApp(mobile, message);
    }
};

// 1. Appointment Reminder
const sendAppointmentReminder = async (patient, appointmentDetails, channel = 'whatsapp') => {
    const message = `Hello ${patient.name || patient.firstName},\n\nThis is a reminder for your upcoming appointment with Dr. ${appointmentDetails.doctorName} on ${new Date(appointmentDetails.date).toLocaleString()}.\n\nRegards,\nHospital Management`;
    return await sendMessage(patient.user?.mobile || patient.emergencyContact?.phone, message, channel);
};

// 2. Follow-Up Reminder
const sendFollowUpReminder = async (patient, consultationDetails, channel = 'whatsapp') => {
    const message = `Hello ${patient.name || patient.firstName},\n\nYour follow-up visit with Dr. ${consultationDetails.doctor?.name || 'your doctor'} is due on ${new Date(consultationDetails.followUpDate).toLocaleDateString()}.\nRecommendations: ${consultationDetails.followUpRecommendations}\n\nRegards,\nHospital Management`;
    return await sendMessage(patient.user?.mobile || patient.emergencyContact?.phone, message, channel);
};

// 3. Medication Reminder
const sendMedicationReminder = async (patient, prescriptionDetails, channel = 'whatsapp') => {
    const medList = prescriptionDetails.medicines.map(m => `${m.name} (${m.dosage}) - ${m.frequency}`).join('\n');
    const message = `Hello ${patient.name || patient.firstName},\n\nTime for your medication!\n${medList}\n\nStay healthy!`;
    return await sendMessage(patient.user?.mobile || patient.emergencyContact?.phone, message, channel);
};

module.exports = {
    sendAppointmentReminder,
    sendFollowUpReminder,
    sendMedicationReminder,
    sendMessage
};
