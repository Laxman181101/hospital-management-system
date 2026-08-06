const addDoctorValidation = (req, res, next) => {
    const { userId, hospitalId, name, specialization, consultationFee } = req.body;
    
    if (!userId || !hospitalId || !name || !specialization || consultationFee === undefined) {
        return res.status(400).json({ message: 'userId, hospitalId, name, specialization, and consultationFee are required' });
    }
    next();
};

const updateProfileValidation = (req, res, next) => {
    const { specialization, consultationFee, availabilitySchedule } = req.body;
    
    // Just a simple validation to ensure they are passing something
    if (!specialization && consultationFee === undefined && !availabilitySchedule) {
        return res.status(400).json({ message: 'Please provide fields to update' });
    }
    next();
};

module.exports = {
    addDoctorValidation,
    updateProfileValidation
};
