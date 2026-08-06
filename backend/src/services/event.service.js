const EventEmitter = require('events');
const Notification = require('../modules/notification/notification.model');
const socketService = require('./socket.service');
const emailService = require('./email.service');
const notificationService = require('../modules/notification/notification.service');

class NotificationEmitter extends EventEmitter {}

const notificationEmitter = new NotificationEmitter();

/**
 * Event: 'notification:send'
 * Payload: { recipient: ObjectId, title: String, message: String, type: String, emailOptions: { to, subject, html }, smsOptions: { mobile, message, channel } }
 */
notificationEmitter.on('notification:send', async (data) => {
    try {
        const { recipient, title, message, type, relatedData, emailOptions, smsOptions } = data;

        // 1. Save to Database (In-App)
        const newNotification = await Notification.create({
            recipient,
            title,
            message,
            type: type || 'info',
            relatedData
        });

        // 2. Push Real-time via WebSockets
        socketService.sendToUser(recipient, 'new_notification', newNotification);

        // 3. Send Email if requested
        if (emailOptions && emailOptions.to) {
            await emailService.sendEmail(emailOptions.to, emailOptions.subject, emailOptions.html);
        }

        // 4. Send SMS/WhatsApp if requested
        if (smsOptions && smsOptions.mobile) {
            await notificationService.sendMessage(smsOptions.mobile, smsOptions.message, smsOptions.channel || 'whatsapp');
        }

        console.log(`[EventService] Processed 'notification:send' event for user ${recipient}`);
    } catch (error) {
        console.error('[EventService] Error processing notification event:', error);
    }
});

module.exports = notificationEmitter;
