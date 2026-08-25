const createSessionValidation = (req, res, next) => {
    const { patientId, doctorId, appointmentId } = req.body;
    
    if (!appointmentId && (!patientId || !doctorId)) {
        return res.status(400).json({ message: 'Doctor ID and Patient ID (or Appointment ID) are required' });
    }
    
    next();
};

const sendMessageValidation = (req, res, next) => {
    const { sessionId, content } = req.body;
    
    if (!sessionId) {
        return res.status(400).json({ message: 'Session ID is required' });
    }
    if (!content) {
        return res.status(400).json({ message: 'Message content is required' });
    }
    
    next();
};

module.exports = {
    createSessionValidation,
    sendMessageValidation
};
