const chatService = require('./chat-consultation.service');

exports.createSession = async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.appointmentId && (!data.doctorId || !data.patientId)) {
            const Appointment = require('../appointment/appointment.model');
            const appt = await Appointment.findById(data.appointmentId);
            if (appt) {
                if (!data.doctorId) data.doctorId = appt.doctor;
                if (!data.patientId) data.patientId = appt.patient;
            }
        }
        const session = await chatService.createSession(data);
        res.status(201).json({
            message: 'Chat session created',
            data: session
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getSessionDetails = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await chatService.getSessionDetails(sessionId);
        res.status(200).json({
            message: 'Session details fetched',
            data: session
        });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        
        const data = await chatService.getSessionMessages(sessionId, page, limit);
        res.status(200).json({
            message: 'Messages fetched successfully',
            data: data
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { sessionId, content, messageType } = req.body;
        // Check role based on token
        const senderModel = (req.user.role === 'doctor') ? 'Doctor' : 'Patient';
        const senderId = req.user.sub || req.user.id;
        
        const message = await chatService.sendMessage(sessionId, senderId, senderModel, content, messageType);
        res.status(201).json({
            message: 'Message sent',
            data: message
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.endSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await chatService.endSession(sessionId);
        res.status(200).json({
            message: 'Session ended',
            data: session
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const filePath = `/uploads/${req.file.filename}`;
        res.status(201).json({
            message: 'File uploaded successfully',
            data: { url: filePath }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
