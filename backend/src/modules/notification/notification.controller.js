const notificationService = require('./notification.service');
const Patient = require('../patient/patient.model');

const sendCustomMessage = async (req, res) => {
    try {
        const { mobile, message, channel } = req.body;
        const sent = await notificationService.sendMessage(mobile, message, channel);
        res.status(200).json({ message: `Custom message triggered via ${channel || 'whatsapp'}`, success: sent });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const triggerAppointmentReminder = async (req, res) => {
    try {
        const { patientId, doctorName, date, channel } = req.body;
        
        const patient = await Patient.findById(patientId).populate('user', 'mobile');
        if (!patient) return res.status(404).json({ message: 'Patient not found' });
        
        const appointmentMock = { doctorName, date };
        await notificationService.sendAppointmentReminder(patient, appointmentMock, channel);
        
        res.status(200).json({ message: 'Appointment reminder triggered successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const triggerFollowUpReminder = async (req, res) => {
    try {
        const { patientId, doctorName, followUpDate, followUpRecommendations, channel } = req.body;
        
        const patient = await Patient.findById(patientId).populate('user', 'mobile');
        if (!patient) return res.status(404).json({ message: 'Patient not found' });
        
        const consultationMock = { 
            doctor: { name: doctorName }, 
            followUpDate, 
            followUpRecommendations 
        };
        await notificationService.sendFollowUpReminder(patient, consultationMock, channel);
        
        res.status(200).json({ message: 'Follow-up reminder triggered successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const triggerMedicationReminder = async (req, res) => {
    try {
        const { patientId, medicines, channel } = req.body;
        
        const patient = await Patient.findById(patientId).populate('user', 'mobile');
        if (!patient) return res.status(404).json({ message: 'Patient not found' });
        
        const prescriptionMock = { medicines };
        await notificationService.sendMedicationReminder(patient, prescriptionMock, channel);
        
        res.status(200).json({ message: 'Medication reminder triggered successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const Notification = require('./notification.model');

const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.sub || req.user.id;
        const notifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        const userId = req.user.sub || req.user.id;
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: userId },
            { isRead: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    sendCustomMessage,
    triggerAppointmentReminder,
    triggerFollowUpReminder,
    triggerMedicationReminder,
    getMyNotifications,
    markAsRead
};
