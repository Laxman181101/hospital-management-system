const registerValidation = (req, res, next) => {
    let { email, mobile, password, name, firstName, lastName, gender, dateOfBirth } = req.body;
    
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    
    // Convert email to lowercase and assign back to req.body
    req.body.email = email.toLowerCase();
    

    if (!mobile) {
        return res.status(400).json({ message: 'Mobile number is required' });
    }
    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password is required and must be at least 6 characters' });
    }
    if (!name && (!firstName || !lastName)) {
        return res.status(400).json({ message: 'Name or (First name and Last name) is required' });
    }
    if (gender && !['male', 'female', 'other'].includes(gender)) {
        return res.status(400).json({ message: 'Gender must be one of: male, female, other' });
    }
    if (dateOfBirth && isNaN(Date.parse(dateOfBirth))) {
        return res.status(400).json({ message: 'A valid dateOfBirth is required' });
    }
    
    if (!req.body.bloodGroup || req.body.bloodGroup === '') {
        delete req.body.bloodGroup;
    }
    
    if (req.body.hospitalId === '') {
        delete req.body.hospitalId;
    }
    
    next();
};

const profileUpdateValidation = (req, res, next) => {
    const { gender, dateOfBirth, bloodGroup } = req.body;
    
    if (gender && !['male', 'female', 'other'].includes(gender)) {
        return res.status(400).json({ message: 'Gender must be one of: male, female, other' });
    }
    if (dateOfBirth && isNaN(Date.parse(dateOfBirth))) {
        return res.status(400).json({ message: 'A valid dateOfBirth is required' });
    }
    if (bloodGroup && !['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(bloodGroup)) {
        return res.status(400).json({ message: 'Blood group must be a valid type (e.g. A+, O-, AB+)' });
    }
    
    if (!req.body.bloodGroup) {
        delete req.body.bloodGroup;
    }
    
    next();
};

const medicalHistoryValidation = (req, res, next) => {
    const { condition, status } = req.body;
    
    if (!condition) {
        return res.status(400).json({ message: 'Condition is required' });
    }
    if (status && !['active', 'resolved'].includes(status)) {
        return res.status(400).json({ message: 'Status must be active or resolved' });
    }
    
    next();
};

const appointmentValidation = async (req, res, next) => {
    try {
        let { doctorName, doctor, doctorId, date, status, type } = req.body;
        
        if (!doctorName && (doctor || doctorId)) {
            const Doctor = require('../doctor/doctor.model');
            const doc = await Doctor.findById(doctor || doctorId);
            if (doc) {
                req.body.doctorName = doc.name;
                req.body.doctorId = doc._id;
                doctorName = doc.name;
            }
        }
        
        if (!doctorName) {
            return res.status(400).json({ message: 'Doctor name is required' });
        }
        if (!date || isNaN(Date.parse(date))) {
            return res.status(400).json({ message: 'A valid appointment date is required' });
        }
        if (status && !['scheduled', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Status must be scheduled, completed, or cancelled' });
        }
        if (type && !['in-person', 'video'].includes(type)) {
            return res.status(400).json({ message: 'Type must be in-person or video' });
        }
        
        next();
    } catch (err) {
        next(err);
    }
};

const prescriptionValidation = (req, res, next) => {
    const { doctorName, date, medicines } = req.body;
    
    if (!doctorName) {
        return res.status(400).json({ message: 'Doctor name is required' });
    }
    if (date && isNaN(Date.parse(date))) {
        return res.status(400).json({ message: 'Date is invalid' });
    }
    if (medicines && !Array.isArray(medicines)) {
        return res.status(400).json({ message: 'Medicines must be an array' });
    }
    if (medicines) {
        for (const med of medicines) {
            if (!med.name || !med.dosage || !med.frequency || !med.duration) {
                return res.status(400).json({
                    message: 'Each medicine must include: name, dosage, frequency, and duration'
                });
            }
        }
    }
    
    next();
};

const manualRegisterValidation = (req, res, next) => {
    let { email, mobile, password, name, firstName, lastName, gender, dateOfBirth } = req.body;
    
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    
    // Convert email to lowercase and assign back to req.body
    req.body.email = email.toLowerCase();
    

    if (!mobile) {
        return res.status(400).json({ message: 'Mobile number is required' });
    }
    if (password && password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters if provided' });
    }
    if (!name && (!firstName || !lastName)) {
        return res.status(400).json({ message: 'Name or (First name and Last name) is required' });
    }
    if (gender && !['male', 'female', 'other'].includes(gender)) {
        return res.status(400).json({ message: 'Gender must be one of: male, female, other' });
    }
    if (dateOfBirth && isNaN(Date.parse(dateOfBirth))) {
        return res.status(400).json({ message: 'A valid dateOfBirth is required' });
    }
    
    if (!req.body.bloodGroup || req.body.bloodGroup === '') {
        delete req.body.bloodGroup;
    }
    
    if (req.body.hospitalId === '') {
        delete req.body.hospitalId;
    }
    
    next();
};

module.exports = {
    registerValidation,
    profileUpdateValidation,
    medicalHistoryValidation,
    appointmentValidation,
    prescriptionValidation,
    manualRegisterValidation
};
