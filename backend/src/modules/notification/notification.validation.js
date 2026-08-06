const sendCustomValidation = (req, res, next) => {
    const { mobile, message, channel } = req.body;
    
    if (!mobile) {
        return res.status(400).json({ message: 'Mobile number is required' });
    }
    if (!message) {
        return res.status(400).json({ message: 'Message content is required' });
    }
    if (channel && !['whatsapp', 'sms'].includes(channel.toLowerCase())) {
        return res.status(400).json({ message: 'Channel must be either whatsapp or sms' });
    }
    
    next();
};

const reminderValidation = (req, res, next) => {
    const { patientId } = req.body;
    
    if (!patientId) {
        return res.status(400).json({ message: 'Patient ID is required' });
    }
    // Additional IDs like appointmentId or consultationId will be checked in the controller
    
    next();
};

module.exports = {
    sendCustomValidation,
    reminderValidation
};
