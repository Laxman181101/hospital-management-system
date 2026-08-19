const Hospital = require('../hospital/hospital.model');
const Auth = require('../auth/auth.model');
const Patient = require('../patient/patient.model');
const Appointment = require('../appointment/appointment.model');
const Doctor = require('../doctor/doctor.model');
const Consultation = require('../consultation/consultation.model');
const Payment = require('../payment/payment.model');

const getTrendData = async (matchQuery) => {
    const [revenueTrendData, appointmentTrendData, patientTrendData] = await Promise.all([
        // 1. Revenue Trend
        Appointment.aggregate([
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
                        year: { $year: { $ifNull: ['$appointmentDate', { $ifNull: ['$date', '$createdAt'] }] } },
                        month: { $month: { $ifNull: ['$appointmentDate', { $ifNull: ['$date', '$createdAt'] }] } }
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
        ]),
        // 2. Appointment Trend
        Appointment.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        year: { $year: { $ifNull: ['$appointmentDate', { $ifNull: ['$date', '$createdAt'] }] } },
                        month: { $month: { $ifNull: ['$appointmentDate', { $ifNull: ['$date', '$createdAt'] }] } }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]),
        // 3. Patient Trend
        Appointment.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        year: { $year: { $ifNull: ['$appointmentDate', { $ifNull: ['$date', '$createdAt'] }] } },
                        month: { $month: { $ifNull: ['$appointmentDate', { $ifNull: ['$date', '$createdAt'] }] } },
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
        ])
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
    const [
        totalHospitals,
        totalUsers,
        totalDoctors,
        totalAppointments,
        totalConsultations,
        totalPatients,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments,
        recentHospitals,
        recentAppointments,
        userDistributionRaw,
        patientGrowthRaw,
        trends
    ] = await Promise.all([
        Hospital.countDocuments(),
        Auth.countDocuments(),
        Doctor.countDocuments(),
        Appointment.countDocuments(),
        Consultation.countDocuments(),
        Patient.countDocuments(),
        Appointment.countDocuments({ status: 'pending' }),
        Appointment.countDocuments({ status: 'confirmed' }),
        Appointment.countDocuments({ status: 'completed' }),
        Appointment.countDocuments({ status: 'cancelled' }),
        Hospital.find().sort({ createdAt: -1 }).limit(5).select('hospitalName email phone address status createdAt'),
        Appointment.find().sort({ createdAt: -1 }).limit(5).populate('patient', 'name').populate('doctor', 'name').populate('hospital', 'hospitalName'),
        Auth.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]),
        Patient.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    '_id.year': 1,
                    '_id.month': 1
                }
            }
        ]),
        getTrendData({})
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const userDistribution = userDistributionRaw.map(item => ({
        role: item._id || 'unassigned',
        count: item.count
    }));

    const patientGrowth = patientGrowthRaw.map(item => ({
        year: item._id.year,
        month: item._id.month,
        monthLabel: `${monthNames[item._id.month - 1] || `Month ${item._id.month}`} ${item._id.year}`,
        monthName: monthNames[item._id.month - 1] || `Month ${item._id.month}`,
        count: item.count
    }));

    return {
        totalHospitals,
        totalUsers,
        totalDoctors,
        userDistribution,
        patientGrowth,
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

        [dailyAppointments, pendingConsultations, trends] = await Promise.all([
            Appointment.countDocuments({
                doctor: doctor._id,
                $or: [
                    { appointmentDate: { $gte: todayStart, $lte: todayEnd } },
                    { date: { $gte: todayStart, $lte: todayEnd } }
                ]
            }),
            Consultation.countDocuments({
                doctor: doctor._id,
                status: 'draft'
            }),
            getTrendData({ doctor: doctor._id })
        ]);
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

const getSuperAdminAnalytics = async (queryParams = {}) => {
    const { range, startDate, endDate } = queryParams;

    const effectiveRevenueDate = { $ifNull: ['$paidAt', '$createdAt'] };
    let dateMatchExpr = null;
    const now = new Date();

    if (startDate && endDate) {
        dateMatchExpr = {
            $expr: {
                $and: [
                    { $gte: [effectiveRevenueDate, new Date(startDate)] },
                    { $lte: [effectiveRevenueDate, new Date(endDate)] }
                ]
            }
        };
    } else if (range === 'monthly' || !range) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        dateMatchExpr = {
            $expr: { $gte: [effectiveRevenueDate, sixMonthsAgo] }
        };
    } else if (range === 'yearly') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        dateMatchExpr = {
            $expr: { $gte: [effectiveRevenueDate, startOfYear] }
        };
    }

    const paidMatch = {
        status: { $in: ['paid', 'success'] },
        ...(dateMatchExpr || {})
    };

    const [
        totalHospitals,
        activeHospitals,
        inactiveHospitals,
        totalRevenueResult,
        totalPaymentsCount,
        paymentStatusBreakdown,
        revenueTrendRaw,
        revenueByHospitalRaw
    ] = await Promise.all([
        Hospital.countDocuments(),
        Hospital.countDocuments({ isActive: true }),
        Hospital.countDocuments({ isActive: false }),
        Payment.aggregate([
            { $match: { status: { $in: ['paid', 'success'] } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Payment.countDocuments({ status: { $in: ['paid', 'success'] } }),
        Payment.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
        ]),
        Payment.aggregate([
            { $match: paidMatch },
            {
                $group: {
                    _id: {
                        year: { $year: effectiveRevenueDate },
                        month: { $month: effectiveRevenueDate }
                    },
                    revenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]),
        Payment.aggregate([
            { $match: paidMatch },
            {
                $lookup: {
                    from: 'appointments',
                    localField: 'appointment',
                    foreignField: '_id',
                    as: 'appointmentInfo'
                }
            },
            { $unwind: { path: '$appointmentInfo', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'hospitals',
                    localField: 'appointmentInfo.hospital',
                    foreignField: '_id',
                    as: 'hospitalInfo'
                }
            },
            { $unwind: { path: '$hospitalInfo', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { $ifNull: ['$hospitalInfo._id', 'unassigned'] },
                    hospitalName: { $first: { $ifNull: ['$hospitalInfo.hospitalName', 'Platform / General'] } },
                    hospitalCode: { $first: { $ifNull: ['$hospitalInfo.code', 'N/A'] } },
                    revenue: { $sum: '$amount' },
                    transactionCount: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 }
        ])
    ]);

    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const revenueOverview = revenueTrendRaw.map(item => ({
        period: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        month: monthNames[item._id.month - 1],
        year: item._id.year,
        revenue: item.revenue,
        count: item.count
    }));

    const statusDistribution = paymentStatusBreakdown.map(item => ({
        status: item._id,
        count: item.count,
        totalAmount: item.totalAmount
    }));

    return {
        summary: {
            totalRevenue,
            currency: 'INR',
            currencySymbol: '₹',
            totalHospitals,
            activeHospitals,
            inactiveHospitals,
            totalPaymentsCount,
            mrr: null,
            arr: null,
            mrrAvailable: false,
            mrrMessage: 'Subscription billing data is not configured in current database schema.'
        },
        revenueOverview,
        revenueByHospital: revenueByHospitalRaw.map(item => ({
            hospitalId: item._id,
            hospitalName: item.hospitalName,
            hospitalCode: item.hospitalCode,
            revenue: item.revenue,
            transactionCount: item.transactionCount
        })),
        statusDistribution
    };
};

module.exports = {
    getSuperAdminSummary,
    getSuperAdminAnalytics,
    getHospitalAdminSummary,
    getDoctorSummary,
    getAppointmentStats,
    getPatientStats,
    getRevenueSummary,
    getPlatformUsage,
    getCompleteDoctorDashboard
};
