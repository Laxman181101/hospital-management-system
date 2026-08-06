const AudioConsultation = require('./audio-consultation.model');

const createConsultation = async (doctorId, data) => {
    const consultation = await AudioConsultation.create({
        doctor: doctorId,
        patient: data.patientId,
        appointmentId: data.appointmentId,
        scheduledDate: data.scheduledDate
    });
    return consultation;
};

const generateMeetingLink = async (consultationId) => {
    // Integrate with Twilio Voice / Agora / Jitsi here in the future
    const uniqueRoomId = Math.random().toString(36).substring(7);
    const meetingLink = `https://meet.jit.si/HMS-Audio-${uniqueRoomId}#config.startAudioOnly=true`;
    
    const consultation = await AudioConsultation.findByIdAndUpdate(
        consultationId,
        { meetingLink },
        { new: true }
    );
    if (!consultation) throw new Error('Audio consultation not found');
    return consultation;
};

const getDoctorAppointments = async (doctorId) => {
    return await AudioConsultation.find({ doctor: doctorId })
        .populate('patient', 'name firstName lastName')
        .sort({ scheduledDate: 1 });
};

const getDetails = async (consultationId) => {
    const consultation = await AudioConsultation.findById(consultationId)
        .populate('doctor', 'name specialization')
        .populate('patient', 'name firstName lastName');
    if (!consultation) throw new Error('Audio consultation not found');
    return consultation;
};

const updateStatus = async (consultationId, status) => {
    const consultation = await AudioConsultation.findByIdAndUpdate(
        consultationId,
        { status },
        { new: true }
    );
    if (!consultation) throw new Error('Audio consultation not found');
    return consultation;
};

module.exports = {
    createConsultation,
    generateMeetingLink,
    getDoctorAppointments,
    getDetails,
    updateStatus
};
