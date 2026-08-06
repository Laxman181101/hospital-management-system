const VideoConsultation = require('./video-consultation.model');
const crypto = require('crypto');

// 1. Create video consultation
const createVideoConsultation = async (doctorId, data) => {
    const consultation = new VideoConsultation({
        doctor: doctorId,
        patient: data.patientId,
        appointmentId: data.appointmentId, // optional
        scheduledDate: data.scheduledDate,
        status: 'scheduled'
    });
    
    await consultation.save();
    return consultation;
};

// 2. Fetch details
const getConsultationById = async (id) => {
    const consultation = await VideoConsultation.findById(id)
        .populate('doctor', 'name specialization')
        .populate('patient', 'name firstName lastName');
        
    if (!consultation) throw new Error('Video consultation not found');
    return consultation;
};

// 3. Generate link
const generateMeetingLink = async (id, doctorId) => {
    const consultation = await VideoConsultation.findOne({ _id: id, doctor: doctorId });
    if (!consultation) throw new Error('Consultation not found or unauthorized');

    // Generate Jitsi link
    const uniqueHash = crypto.randomBytes(6).toString('hex');
    const meetingLink = `https://meet.jit.si/HMS-Video-${uniqueHash}-${Date.now()}`;
    
    consultation.meetingLink = meetingLink;
    await consultation.save();
    return consultation;
};

// 4. Join consultation
const joinConsultation = async (id) => {
    const consultation = await VideoConsultation.findById(id);
    if (!consultation) throw new Error('Consultation not found');
    if (!consultation.meetingLink) throw new Error('Meeting link has not been generated yet');
    
    return { meetingLink: consultation.meetingLink };
};

// 5. Update status
const updateStatus = async (id, doctorId, status) => {
    const consultation = await VideoConsultation.findOne({ _id: id, doctor: doctorId });
    if (!consultation) throw new Error('Consultation not found or unauthorized');

    consultation.status = status;
    await consultation.save();
    return consultation;
};

// 6. Get doctor's video appointments
const getDoctorVideoAppointments = async (doctorId) => {
    const consultations = await VideoConsultation.find({ doctor: doctorId })
        .populate('patient', 'name firstName lastName')
        .sort({ scheduledDate: 1 });
    return consultations;
};

module.exports = {
    createVideoConsultation,
    getConsultationById,
    generateMeetingLink,
    joinConsultation,
    updateStatus,
    getDoctorVideoAppointments
};
