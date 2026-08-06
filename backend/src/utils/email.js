const fs = require('fs');
const path = require('path');
const env = require('../config/env');

// Dynamic loading of nodemailer to prevent server crash if not installed
let nodemailer;
try {
    nodemailer = require('nodemailer');
} catch (err) {
    console.warn('Nodemailer is not installed. Email sending will fallback to local file logging (mail-logs.txt).');
}

/**
 * Send Receipt Email to Patient
 * @param {string} toEmail - Patient's email
 * @param {object} receiptDetails - Details of the receipt to email
 */
const sendReceiptEmail = async (toEmail, receiptDetails) => {
    const { receiptNumber, patientName, doctorName, date, amount, transactionId, paymentMethod } = receiptDetails;

    const emailSubject = `Payment Receipt - ${receiptNumber} - Hospital Management System`;
    const formattedDate = new Date(date).toLocaleString();

    const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
            <h2 style="color: #4F46E5; text-align: center;">Payment Receipt</h2>
            <p>Dear <strong>${patientName}</strong>,</p>
            <p>Thank you for your payment. Your appointment has been confirmed. Below are your receipt details:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr style="background-color: #f9fafb;">
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Receipt Number</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${receiptNumber}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Transaction ID</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${transactionId}</td>
                </tr>
                <tr style="background-color: #f9fafb;">
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Payment Method</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-transform: uppercase;">${paymentMethod}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Doctor Name</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${doctorName}</td>
                </tr>
                <tr style="background-color: #f9fafb;">
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Appointment Date/Time</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${formattedDate}</td>
                </tr>
                <tr style="font-size: 1.1em; font-weight: bold; color: #111827;">
                    <td style="padding: 8px; border: 1px solid #ddd; color: #4F46E5;">Total Paid</td>
                    <td style="padding: 8px; border: 1px solid #ddd; color: #4F46E5;">₹${amount}</td>
                </tr>
            </table>

            <p style="margin-top: 25px; font-size: 0.9em; color: #6b7280; text-align: center;">
                This is a system-generated receipt. For any questions, please contact our support team.
            </p>
        </div>
    `;

    // 1. Attempt sending with real nodemailer if configured
    if (nodemailer && env.smtpHost && env.smtpUser && env.smtpPass) {
        try {
            const transporter = nodemailer.createTransport({
                host: env.smtpHost,
                port: parseInt(env.smtpPort, 10) || 587,
                secure: parseInt(env.smtpPort, 10) === 465, // true for port 465, false for other ports
                auth: {
                    user: env.smtpUser,
                    pass: env.smtpPass,
                },
            });

            await transporter.sendMail({
                from: `"Hospital Management System" <${env.smtpUser}>`,
                to: toEmail,
                subject: emailSubject,
                html: emailHtml,
            });

            console.log(`[Email] Receipt ${receiptNumber} successfully emailed to ${toEmail}`);
            return;
        } catch (mailError) {
            console.error('[Email] Failed to send receipt email via SMTP. Falling back to local logging.', mailError.message);
        }
    }

    // 2. Fallback to writing email content to a file & console log
    const logFilePath = path.join(__dirname, '../../mail-logs.txt');
    const logContent = `
========================================
TIMESTAMP: ${new Date().toISOString()}
TO: ${toEmail}
SUBJECT: ${emailSubject}
----------------------------------------
Receipt Number: ${receiptNumber}
Transaction ID: ${transactionId}
Payment Method: ${paymentMethod}
Patient Name  : ${patientName}
Doctor Name   : ${doctorName}
Appointment   : ${formattedDate}
Amount Paid   : ₹${amount}
========================================
\n`;

    try {
        fs.appendFileSync(logFilePath, logContent);
        console.log(`[Mock Email] Receipt ${receiptNumber} email logged to mail-logs.txt for patient: ${toEmail}`);
    } catch (fsError) {
        console.error('Failed to write email to mail-logs.txt', fsError.message);
    }
};

module.exports = {
    sendReceiptEmail
};
