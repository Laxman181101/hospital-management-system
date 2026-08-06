const createValidation = (req, res, next) => {
    const { patientId, scheduledDate } = req.body;
    
    if (!patientId) {
        return res.status(400).json({ message: 'Patient ID is required' });
    }
    if (!scheduledDate || isNaN(Date.parse(scheduledDate))) {
        return res.status(400).json({ message: 'A valid scheduled date is required' });
    }
    
    next();
};

const statusValidation = (req, res, next) => {
    const { status } = req.body;
    if (!status || !['scheduled', 'ongoing', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Status must be scheduled, ongoing, completed, or cancelled' });
    }
    next();
};

module.exports = {
    createValidation,
    statusValidation
};
