const createConsultationValidation = (req, res, next) => {
    const patientId = req.body.patientId || req.body.patient;
    
    if (!patientId) {
        return res.status(400).json({ message: 'Patient ID is required' });
    }
    
    req.body.patientId = patientId;
    next();
};

const symptomsValidation = (req, res, next) => {
    const { symptoms } = req.body;
    if (!symptoms || symptoms.trim().length === 0) {
        return res.status(400).json({ message: 'Symptoms are required' });
    }
    next();
};

const diagnosisValidation = (req, res, next) => {
    const { diagnosis } = req.body;
    if (!diagnosis || diagnosis.trim().length === 0) {
        return res.status(400).json({ message: 'Diagnosis is required' });
    }
    next();
};

const notesValidation = (req, res, next) => {
    const { clinicalNotes } = req.body;
    if (!clinicalNotes || clinicalNotes.trim().length === 0) {
        return res.status(400).json({ message: 'Clinical notes are required' });
    }
    next();
};

const followupValidation = (req, res, next) => {
    const { followUpDate, followUpRecommendations } = req.body;
    if (!followUpDate && !followUpRecommendations) {
        return res.status(400).json({ message: 'Follow-up date or recommendations are required' });
    }
    next();
};

const updateConsultationValidation = (req, res, next) => {
    const { status } = req.body;
    if (status && !['draft', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Status must be draft or completed' });
    }
    next();
};

module.exports = {
    createConsultationValidation,
    symptomsValidation,
    diagnosisValidation,
    notesValidation,
    followupValidation,
    updateConsultationValidation
};
