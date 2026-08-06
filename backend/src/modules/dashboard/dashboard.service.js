const Hospital = require('../hospital/hospital.model');
const Auth = require('../auth/auth.model');
const Patient = require('../patient/patient.model');
const Appointment = require('../appointment/appointment.model');
const Doctor = require('../doctor/doctor.model');
const Consultation = require('../consultation/consultation.model');

const getTrendData = async (matchQuery) => {
    // 1. Revenue Trend
    const revenueTrendData = await Appointment.aggregate([
        { $match: { ...matchQuery, paymentStatus: { $in: ['paid', 'success'] } } },
        {
            $lookup: {
                from: 'doctors',
                localField: 'doctor',
                foreignField: '_id',
                as: 'doctorInfo'
            }
        },
        { $unwind: { path: '$doctorInfo', preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: {
                    year: { $year: { $ifNull: ['$appointmentDate', '$createdAt'] } },
                    month: { $month: { $ifNull: ['$appointmentDate', '$createdAt'] } }
                },
                revenue: {
                    $sum: {
                        $ifNull: [
                            '$consultationFee',
                            { $ifNull: ['$doctorInfo.consultationFee', 0] }
                        ]
                    }
                }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 2. Appointment Trend
    const appointmentTrendData = await Appointment.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: {
                    year: { $year: { $ifNull: ['$appointmentDate', '$createdAt'] } },
                    month: { $month: { $ifNull: ['$appointmentDate', '$createdAt'] } }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 3. Patient Trend
    const patientTrendData = await Appointment.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: {
                    year: { $year: { $ifNull: ['$appointmentDate', '$createdAt'] } },
                    month: { $month: { $ifNull: ['$appointmentDate', '$createdAt'] } },
                    patient: '$patient'
                }
            }
        },
        {
            $group: {
                _id: {
                    year: '$_id.year',
                    month: '$_id.month'
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const formatTrend = (trendList, valueField) => {
        return trendList.map(item => ({
            month: monthNames[item._id.month - 1] || `Month ${item._id.month}`,
            [valueField]: item[valueField]
        }));
    };

    return {
        revenueTrend: formatTrend(revenueTrendData, 'revenue'),
        appointmentTrend: formatTrend(appointmentTrendData, 'count'),
        patientTrend: formatTrend(patientTrendData, 'count')
    };
};

const getSuperAdminSummary = async () => {
    const totalHospitals = await Hospital.countDocuments();
    const totalUsers = await Auth.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    
    const totalAppointments = await Appointment.countDocuments();
    const totalConsultations = await Consultation.countDocuments();
    const totalPatients = await Patient.countDocuments();

    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    const confirmedAppointments = await Appointment.countDocuments({ status: 'confirmed' });
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' });

    const recentHospitals = await Hospital.find().sort({ createdAt: -1 }).limit(5).select('hospitalName email phone address status createdAt');
    const recentAppointments = await Appointment.find().sort({ createdAt: -1 }).limit(5).populate('patient', 'name').populate('doctor', 'name').populate('hospital', 'hospitalName');

    const trends = await getTrendData({});

    return {
        totalHospitals,
        totalUsers,
        totalDoctors,
        platformUsage: {
            totalAppointments,
            totalConsultations,
            totalPatients
        },
        appointmentStats: {
            pending: pendingAppointments,
            confirmed: confirmedAppointments,
            completed: completedAppointments,
            cancelled: cancelledAppointments
        },
        recentHospitals,
        recentAppointments,
        revenueTrend: trends.revenueTrend,
        appointmentTrend: trends.appointmentTrend,
        patientTrend: trends.patientTrend
    };
};

const getHospitalAdminSummary = async (userId) => {
    const hospital = await Hospital.findOne({ createdBy: userId });
    let hospitalId = null;
    let totalAppointments = 0;
    let totalPatients = 0;
    let totalRevenue = 0;
    let totalDoctors = 0;
    let appointmentStats = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    let recentAppointments = [];
    let topDoctors = [];
    let trends = { revenueTrend: [], appointmentTrend: [], patientTrend: [] };

    if (hospital) {
        hospitalId = hospital._id;
        totalAppointments = await Appointment.countDocuments({ hospital: hospitalId });
        
        const uniquePatients = await Appointment.distinct('patient', { hospital: hospitalId });
        totalPatients = uniquePatients.length;

        totalDoctors = await Auth.countDocuments({ hospitalId: hospitalId, role: 'doctor', isApproved: true });

        appointmentStats.pending = await Appointment.countDocuments({ hospital: hospitalId, status: 'pending' });
        appointmentStats.confirmed = await Appointment.countDocuments({ hospital: hospitalId, status: 'confirmed' });
        appointmentStats.completed = await Appointment.countDocuments({ hospital: hospitalId, status: 'completed' });
        appointmentStats.cancelled = await Appointment.countDocuments({ hospital: hospitalId, status: 'cancelled' });

        const paidAppointments = await Appointment.find({ hospital: hospitalId, paymentStatus: 'paid' }).populate('doctor');
        
        totalRevenue = paidAppointments.reduce((sum, appt) => {
            return sum + (appt.doctor && appt.doctor.consultationFee ? appt.doctor.consultationFee : 0);
        }, 0);

        recentAppointments = await Appointment.find({ hospital: hospitalId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('patient', 'name')
            .populate('doctor', 'name');

        topDoctors = await Doctor.find({ hospital: hospitalId })
            .sort({ experience: -1 })
            .limit(5)
            .select('name specialization experience consultationFee user')
            .populate('user', 'profilePicture');

        trends = await getTrendData({ hospital: hospitalId });
    }

    return {
        hospitalName: hospital ? hospital.hospitalName : 'Unknown Hospital',
        totalPatients,
        totalAppointments,
        totalDoctors,
        revenueSummary: {
            totalRevenue,
            revenueTrend: trends.revenueTrend
        },
        appointmentStats,
        recentAppointments,
        topDoctors,
        revenueTrend: trends.revenueTrend,
        appointmentTrend: trends.appointmentTrend,
        patientTrend: trends.patientTrend
    };
};

const getDoctorSummary = async (userId) => {
    const doctor = await Doctor.findOne({ user: userId });
    let dailyAppointments = 0;
    let pendingConsultations = 0;
    let trends = { revenueTrend: [], appointmentTrend: [], patientTrend: [] };

    if (doctor) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        dailyAppointments = await Appointment.countDocuments({
            doctor: doctor._id,
            appointmentDate: { $gte: todayStart, $lte: todayEnd }
        });

        pendingConsultations = await Consultation.countDocuments({
            doctor: doctor._id,
            status: 'draft'
        });

        trends = await getTrendData({ doctor: doctor._id });
    }

    return {
        dailyAppointments,
        pendingConsultations,
        revenueTrend: trends.revenueTrend,
        appointmentTrend: trends.appointmentTrend,
        patientTrend: trends.patientTrend
    };
};

const getAppointmentStats = async (role, userId, hospitalId) => {
    let query = {};
    if (role === 'doctor') {
        const doctor = await Doctor.findOne({ user: userId });
        if (doctor) query.doctor = doctor._id;
    } else if (role === 'hospital_admin') {
        const hospital = await Hospital.findOne({ createdBy: userId });
        if (hospital) query.hospital = hospital._id;
    } else if (role === 'receptionist' && hospitalId) {
        query.hospital = hospitalId;
    }

    const total = await Appointment.countDocuments(query);
    const pending = await Appointment.countDocuments({ ...query, status: 'pending' });
    const confirmed = await Appointment.countDocuments({ ...query, status: 'confirmed' });
    const completed = await Appointment.countDocuments({ ...query, status: 'completed' });
    const cancelled = await Appointment.countDocuments({ ...query, status: 'cancelled' });

    return { total, pending, confirmed, completed, cancelled };
};

const getPatientStats = async (role, userId, hospitalId) => {
    let totalPatients = 0;

    if (role === 'super_admin') {
        totalPatients = await Patient.countDocuments();
    } else if (role === 'hospital_admin') {
        const hospital = await Hospital.findOne({ createdBy: userId });
        if (hospital) {
            const uniquePatients = await Appointment.distinct('patient', { hospital: hospital._id });
            totalPatients = uniquePatients.length;
        }
    } else if (role === 'doctor') {
        const doctor = await Doctor.findOne({ user: userId });
        if (doctor) {
            const uniquePatients = await Appointment.distinct('patient', { doctor: doctor._id });
            totalPatients = uniquePatients.length;
        }
    } else if (role === 'receptionist' && hospitalId) {
        const uniquePatients = await Appointment.distinct('patient', { hospital: hospitalId });
        totalPatients = uniquePatients.length;
    }

    return { totalPatients };
};

const getRevenueSummary = async (role, userId) => {
    let totalRevenue = 0;
    let query = { paymentStatus: 'paid' };
    let trendQuery = {};

    if (role === 'doctor') {
        const doctor = await Doctor.findOne({ user: userId });
        if (doctor) {
            query.doctor = doctor._id;
            trendQuery.doctor = doctor._id;
        }
    } else if (role === 'hospital_admin') {
        const hospital = await Hospital.findOne({ createdBy: userId });
        if (hospital) {
            query.hospital = hospital._id;
            trendQuery.hospital = hospital._id;
        }
    }

    const paidAppointments = await Appointment.find(query).populate('doctor');
    totalRevenue = paidAppointments.reduce((sum, appt) => {
        return sum + (appt.doctor && appt.doctor.consultationFee ? appt.doctor.consultationFee : 0);
    }, 0);

    const trends = await getTrendData(trendQuery);

    return {
        totalRevenue,
        revenueTrend: trends.revenueTrend
    };
};

const getPlatformUsage = async () => {
    const totalAppointments = await Appointment.countDocuments();
    const totalConsultations = await Consultation.countDocuments();
    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalHospitals = await Hospital.countDocuments();

    return {
        totalAppointments,
        totalConsultations,
        totalPatients,
        totalDoctors,
        totalHospitals
    };
};

const getCompleteDoctorDashboard = async (role, userId, hospitalId) => {
    const [summary, appointmentStats, patientStats, revenueSummary] = await Promise.all([
        getDoctorSummary(userId),
        getAppointmentStats(role, userId, hospitalId),
        getPatientStats(role, userId, hospitalId),
        getRevenueSummary(role, userId)
    ]);

    return {
        ...summary,
        appointments: appointmentStats,
        patients: patientStats,
        revenue: revenueSummary
    };
};

module.exports = {
    getSuperAdminSummary,
    getHospitalAdminSummary,
    getDoctorSummary,
    getAppointmentStats,
    getPatientStats,
    getRevenueSummary,
    getPlatformUsage,
    getCompleteDoctorDashboard
};
