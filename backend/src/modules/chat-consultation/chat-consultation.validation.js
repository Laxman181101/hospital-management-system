const createSessionValidation = (req, res, next) => {
    const { patientId, doctorId } = req.body;
    
    if (!patientId) {
        return res.status(400).json({ message: 'Patient ID is required' });
    }
    if (!doctorId) {
        return res.status(400).json({ message: 'Doctor ID is required' });
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
