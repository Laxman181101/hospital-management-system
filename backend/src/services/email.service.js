const nodemailer = require('nodemailer');

// We use Ethereal for testing if no real credentials are provided
let transporter;

const initializeTransporter = async () => {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        console.log('[EmailService] Using Production SMTP Settings');
    } else {
        // Generate test SMTP service account from ethereal.email
        try {
            let testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log('[EmailService] Using Ethereal Test Account');
        } catch (error) {
            console.warn('[EmailService] Could not connect to Ethereal, email sending will fail silently.', error.message);
        }
    }
};

initializeTransporter().catch(console.error);

const sendEmail = async (to, subject, html) => {
    try {
        if (!transporter) await initializeTransporter();
        
        let info = await transporter.sendMail({
            from: `"Hospital Admin" <${process.env.SMTP_USER || 'admin@hospital.com'}>`, // sender address
            to: to, // list of receivers
            subject: subject, // Subject line
            html: html, // html body
        });

        console.log(`[EmailService] Message sent to ${to}: ${info.messageId}`);
        // If using ethereal, you can preview the email
        if (info.messageId && !process.env.SMTP_HOST) {
            console.log(`[EmailService] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
        return true;
    } catch (error) {
        console.error('[EmailService] Error sending email:', error);
        return false;
    }
};

module.exports = {
    sendEmail
};
