const doctorService = require('./doctor.service');

const addDoctor = async (req, res) => {
    try {
        const doctorData = req.body;
        // Enforce hospital_admin to only add doctors to their own hospital
        if (req.user.role === 'hospital_admin' && req.user.hospitalId) {
            doctorData.hospitalId = req.user.hospitalId;
        }
        const doctor = await doctorService.addDoctor(doctorData);
        res.status(201).json({ message: 'Doctor profile created successfully', doctor });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getDoctors = async (req, res) => {
    try {
        const filters = {
            specialization: req.query.specialization,
            hospitalId: req.query.hospitalId,
            userId: req.query.userId
        };
        // Enforce hospital staff (like hospital_admin, receptionist, etc.) to only see doctors from their own hospital
        if (req.user && req.user.role !== 'super_admin' && req.user.role !== 'patient' && req.user.hospitalId) {
            filters.hospitalId = req.user.hospitalId;
        }
        const doctors = await doctorService.getDoctors(filters);
        res.status(200).json({ doctors });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateOwnProfile = async (req, res) => {
    try {
        // req.user.sub contains the auth user ID from the JWT token
        const userId = req.user.sub; 
        const updateData = req.body;
        
        const updatedDoctor = await doctorService.updateOwnProfile(userId, updateData);
        res.status(200).json({ message: 'Profile updated successfully', doctor: updatedDoctor });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getDoctorAppointments = async (req, res) => {
    try {
        const userId = req.user.sub;
        const appointments = await doctorService.getDoctorAppointments(userId);
        res.status(200).json(appointments);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { availabilitySchedule } = req.body;
        
        const updatedDoctor = await doctorService.updateSchedule(id, availabilitySchedule);
        res.status(200).json({ message: 'Schedule updated successfully', doctor: updatedDoctor });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    addDoctor,
    getDoctors,
    updateOwnProfile,
    getDoctorAppointments,
    updateSchedule
};
