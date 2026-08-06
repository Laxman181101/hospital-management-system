const audioService = require('./audio-consultation.service');

exports.create = async (req, res) => {
    try {
        const doctorId = req.user.role === 'doctor' ? (req.user.sub || req.user.id) : req.body.doctorId;
        const consultation = await audioService.createConsultation(doctorId, req.body);
        res.status(201).json({
            message: 'Audio consultation created',
            data: consultation
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.generateLink = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ message: 'Consultation ID is required' });
        const consultation = await audioService.generateMeetingLink(id);
        res.status(200).json({
            message: 'Link generated',
            data: { meetingLink: consultation.meetingLink }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getDoctorAppointments = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const appointments = await audioService.getDoctorAppointments(doctorId);
        res.status(200).json({
            message: 'Appointments fetched',
            data: appointments
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const consultation = await audioService.getDetails(id);
        res.status(200).json({
            message: 'Details fetched',
            data: consultation
        });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

exports.joinConsultation = async (req, res) => {
    try {
        const { id } = req.params;
        const consultation = await audioService.getDetails(id);
        if (!consultation.meetingLink) {
            return res.status(400).json({ message: 'Meeting link not generated yet' });
        }
        res.status(200).json({
            message: 'Join link',
            data: { meetingLink: consultation.meetingLink }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const consultation = await audioService.updateStatus(id, status);
        res.status(200).json({
            message: 'Status updated',
            data: consultation
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
