const dashboardService = require('./dashboard.service');

const getSuperAdminSummary = async (req, res, next) => {
    try {
        const summary = await dashboardService.getSuperAdminSummary();
        res.status(200).json(summary);
    } catch (error) {
        next(error);
    }
};

const getSuperAdminAnalytics = async (req, res, next) => {
    try {
        const analytics = await dashboardService.getSuperAdminAnalytics(req.query);
        res.status(200).json(analytics);
    } catch (error) {
        next(error);
    }
};

const getHospitalAdminSummary = async (req, res, next) => {
    try {
        const summary = await dashboardService.getHospitalAdminSummary(req.user.sub);
        res.status(200).json(summary);
    } catch (error) {
        next(error);
    }
};

const getDoctorSummary = async (req, res, next) => {
    try {
        const summary = await dashboardService.getDoctorSummary(req.user.sub);
        res.status(200).json(summary);
    } catch (error) {
        next(error);
    }
};

const getAppointmentStats = async (req, res, next) => {
    try {
        const stats = await dashboardService.getAppointmentStats(req.user.role, req.user.sub, req.user.hospitalId);
        res.status(200).json(stats);
    } catch (error) {
        next(error);
    }
};

const getPatientStats = async (req, res, next) => {
    try {
        const stats = await dashboardService.getPatientStats(req.user.role, req.user.sub, req.user.hospitalId);
        res.status(200).json(stats);
    } catch (error) {
        next(error);
    }
};

const getRevenueSummary = async (req, res, next) => {
    try {
        const summary = await dashboardService.getRevenueSummary(req.user.role, req.user.sub);
        res.status(200).json(summary);
    } catch (error) {
        next(error);
    }
};

const getPlatformUsage = async (req, res, next) => {
    try {
        const usage = await dashboardService.getPlatformUsage();
        res.status(200).json(usage);
    } catch (error) {
        next(error);
    }
};

const getCompleteDoctorDashboard = async (req, res, next) => {
    try {
        const data = await dashboardService.getCompleteDoctorDashboard(req.user.role, req.user.sub, req.user.hospitalId);
        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
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
