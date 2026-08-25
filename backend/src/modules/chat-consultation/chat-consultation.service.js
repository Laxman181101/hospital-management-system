const ChatSession = require('./chatSession.model');
const ChatMessage = require('./chatMessage.model');
const socketService = require('../../services/socket.service');

const createSession = async (data) => {
    // Check if active session already exists for this appointment or doctor/patient
    let session = null;
    if (data.appointmentId) {
        session = await ChatSession.findOne({
            appointmentId: data.appointmentId,
            status: 'active'
        });
    }

    if (!session && data.doctorId && data.patientId) {
        session = await ChatSession.findOne({
            doctor: data.doctorId,
            patient: data.patientId,
            status: 'active'
        });
    }

    if (!session) {
        session = await ChatSession.create({
            doctor: data.doctorId,
            patient: data.patientId,
            appointmentId: data.appointmentId
        });
    }
    return session;
};

const getSessionDetails = async (sessionId) => {
    const session = await ChatSession.findById(sessionId)
        .populate('doctor', 'name firstName lastName specialization')
        .populate('patient', 'name firstName lastName');
    if (!session) throw new Error('Session not found');
    return session;
};

const getSessionMessages = async (sessionId, page = 1, limit = 50) => {
    const skip = (page - 1) * limit;
    const messages = await ChatMessage.find({ session: sessionId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    
    return {
        messages: messages.reverse(),
        total: await ChatMessage.countDocuments({ session: sessionId })
    };
};

const sendMessage = async (sessionId, senderId, senderModel, content, messageType = 'text') => {
    const session = await ChatSession.findById(sessionId);
    if (!session || session.status === 'closed') {
        throw new Error('Chat session is not active or does not exist');
    }

    const message = await ChatMessage.create({
        session: sessionId,
        senderId,
        senderModel,
        content,
        messageType
    });

    // Emit real-time event to the active session room
    socketService.sendToRoom(`session_${sessionId}`, 'receive_message', message);

    // Also determine receiver based on who sent it and send direct notification
    const receiverId = senderModel === 'Doctor' ? session.patient : session.doctor;
    if (receiverId) {
        socketService.sendToUser(receiverId, 'receive_message', message);
    }

    return message;
};

const endSession = async (sessionId) => {
    const session = await ChatSession.findByIdAndUpdate(
        sessionId,
        { status: 'closed', closedAt: Date.now() },
        { new: true }
    );
    if (!session) throw new Error('Session not found');
    return session;
};

module.exports = {
    createSession,
    getSessionDetails,
    getSessionMessages,
    sendMessage,
    endSession
};
