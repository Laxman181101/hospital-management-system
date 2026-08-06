const cron = require('node-cron');
const Appointment = require('../modules/appointment/appointment.model');
const notificationEmitter = require('./event.service');
const moment = require('moment'); // You might need moment or just use native Date

const initCronJobs = () => {
    console.log('[CronService] Initializing scheduled jobs...');

    // Runs every day at 08:00 AM
    cron.schedule('0 8 * * *', async () => {
        console.log('[CronService] Running daily appointment reminder job...');
        try {
            // Find appointments for tomorrow
            const tomorrowStart = moment().add(1, 'days').startOf('day').toDate();
            const tomorrowEnd = moment().add(1, 'days').endOf('day').toDate();

            const upcomingAppointments = await Appointment.find({
                date: { $gte: tomorrowStart, $lte: tomorrowEnd },
                status: 'scheduled'
            }).populate('patient').populate('doctor');

            upcomingAppointments.forEach(appt => {
                if (!appt.patient || !appt.patient.user) return; // skip if no user reference

                notificationEmitter.emit('notification:send', {
                    recipient: appt.patient.user,
                    title: 'Upcoming Appointment Reminder',
                    message: `You have an appointment with Dr. ${appt.doctor?.name || 'Doctor'} tomorrow at ${new Date(appt.date).toLocaleTimeString()}.`,
                    type: 'info',
                    emailOptions: appt.patient.email ? {
                        to: appt.patient.email,
                        subject: 'Appointment Reminder - Hospital Management',
                        html: `<p>Hello ${appt.patient.name},</p><p>You have an appointment with Dr. ${appt.doctor?.name || 'Doctor'} tomorrow at <strong>${new Date(appt.date).toLocaleString()}</strong>.</p><p>Regards,<br>Hospital Management</p>`
                    } : null
                });
            });

            console.log(`[CronService] Processed ${upcomingAppointments.length} appointment reminders.`);
        } catch (error) {
            console.error('[CronService] Error in daily appointment reminder job:', error);
        }
    });
};

module.exports = {
    initCronJobs
};
