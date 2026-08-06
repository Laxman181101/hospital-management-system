const Doctor = require('./doctor.model');
const Appointment = require('../appointment/appointment.model');

// Hospital Admin: Add doctor profile
const addDoctor = async (doctorData) => {
    // Check if a doctor profile already exists for this user
    const existingDoctor = await Doctor.findOne({ user: doctorData.userId });
    if (existingDoctor) {
        throw new Error('Doctor profile already exists for this user');
    }

    const doctor = new Doctor({
        user: doctorData.userId,
        hospital: doctorData.hospitalId,
        name: doctorData.name,
        specialization: doctorData.specialization,
        consultationFee: doctorData.consultationFee,
        availabilitySchedule: doctorData.availabilitySchedule || [],
        qualifications: doctorData.qualifications || [],
        experience: doctorData.experience || 0
    });

    await doctor.save();

    // Mark the user's profile as complete in the Auth collection
    const Auth = require('../auth/auth.model');
    await Auth.findByIdAndUpdate(doctorData.userId, { isProfileComplete: true });

    return doctor;
};

// Patient: View doctor list & Filter by specialization
const getDoctors = async (filters) => {
    const query = {};
    
    if (filters.specialization) {
        // Case-insensitive regex search for specialization
        query.specialization = { $regex: new RegExp(filters.specialization, 'i') };
    }
    
    if (filters.hospitalId) {
        query.hospital = filters.hospitalId;
    }

    if (filters.userId) {
        query.user = filters.userId;
    }

    const doctors = await Doctor.find(query).populate('user', 'email mobile isApproved');
    
    // Filter out doctors whose Auth account is soft-deleted (isApproved: false)
    return doctors.filter(doctor => doctor.user && doctor.user.isApproved);
};

// Doctor: Manage own profile
const updateOwnProfile = async (userId, updateData) => {
    const doctor = await Doctor.findOne({ user: userId });
    
    if (!doctor) {
        throw new Error('Doctor profile not found');
    }

    // Allowed fields to update
    if (updateData.specialization) doctor.specialization = updateData.specialization;
    if (updateData.consultationFee !== undefined) doctor.consultationFee = updateData.consultationFee;
    if (updateData.availabilitySchedule) doctor.availabilitySchedule = updateData.availabilitySchedule;
    if (updateData.qualifications) doctor.qualifications = updateData.qualifications;
    if (updateData.experience !== undefined) doctor.experience = updateData.experience;
    
    await doctor.save();
    return doctor;
};

// Doctor: View Appointments
const getDoctorAppointments = async (userId) => {
    const doctor = await Doctor.findOne({ user: userId });
    if (!doctor) {
        throw new Error('Doctor profile not found');
    }
    
    // Query actual appointments for this doctor
    const appointments = await Appointment.find({ doctor: doctor._id })
        .populate('patient', 'firstName lastName email mobile')
        .sort({ appointmentDate: 1, startTime: 1 });

    return appointments;
};

// Staff: Update Doctor Schedule
const updateSchedule = async (doctorId, scheduleData) => {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
        throw new Error('Doctor not found');
    }
    doctor.availabilitySchedule = scheduleData;
    await doctor.save();
    return doctor;
};

module.exports = {
    addDoctor,
    getDoctors,
    updateOwnProfile,
    getDoctorAppointments,
    updateSchedule
};
