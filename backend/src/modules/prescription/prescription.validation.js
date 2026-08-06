const createPrescriptionValidation = (req, res, next) => {
    const { patientId, medicines, patientType } = req.body;
    
    if (!patientId) {
        return res.status(400).json({ message: 'Patient ID is required' });
    }
    
    // For IPD progress notes, medicines can be empty if it's just general instructions
    if (patientType !== 'IPD' && (!medicines || !Array.isArray(medicines) || medicines.length === 0)) {
        return res.status(400).json({ message: 'Medicines array is required and cannot be empty for OPD' });
    }

    if (medicines && Array.isArray(medicines)) {
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

const updatePrescriptionValidation = (req, res, next) => {
    const { medicines } = req.body;
    
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

module.exports = {
    createPrescriptionValidation,
    updatePrescriptionValidation
};
