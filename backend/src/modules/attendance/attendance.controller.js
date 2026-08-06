const Attendance = require('./attendance.model');

// Self check-in (Staff logs in and registers presence)
const checkIn = async (req, res) => {
    try {
        const hospitalId = req.user.hospitalId;
        const staffId = req.user.id || req.user.sub || req.user._id;
        
        if (!hospitalId) {
            return res.status(400).json({ message: 'User must belong to a hospital' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find or create attendance for today
        let attendance = await Attendance.findOne({
            staff: staffId,
            hospital: hospitalId,
            date: today
        });

        if (!attendance) {
            attendance = new Attendance({
                staff: staffId,
                hospital: hospitalId,
                date: today,
                status: 'present',
                checkInTime: new Date(),
                reportedBy: 'self'
            });
        } else {
            // Update existing record
            attendance.status = 'present';
            attendance.checkInTime = new Date();
            attendance.reportedBy = 'self';
        }

        await attendance.save();
        res.status(200).json({ message: 'Checked in successfully', attendance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Self-report delay (Late arrival)
const reportDelay = async (req, res) => {
    const { delayMinutes } = req.body;
    try {
        const hospitalId = req.user.hospitalId;
        const staffId = req.user.id || req.user.sub || req.user._id;

        if (!hospitalId) {
            return res.status(400).json({ message: 'User must belong to a hospital' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let attendance = await Attendance.findOne({
            staff: staffId,
            hospital: hospitalId,
            date: today
        });

        if (!attendance) {
            attendance = new Attendance({
                staff: staffId,
                hospital: hospitalId,
                date: today,
                status: 'late',
                delayMinutes: Number(delayMinutes) || 0,
                reportedBy: 'self'
            });
        } else {
            attendance.status = 'late';
            attendance.delayMinutes = Number(delayMinutes) || 0;
            attendance.reportedBy = 'self';
        }

        await attendance.save();
        res.status(200).json({ message: `Delay of ${delayMinutes} minutes reported`, attendance });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Mark/Override attendance (Receptionist or Hospital Admin)
const markAttendance = async (req, res) => {
    const { staffId, status, delayMinutes, date } = req.body;
    try {
        const hospitalId = req.user.hospitalId;
        if (!hospitalId) {
            return res.status(400).json({ message: 'User must belong to a hospital' });
        }

        const attendanceDate = date ? new Date(date) : new Date();
        attendanceDate.setHours(0, 0, 0, 0);

        let attendance = await Attendance.findOne({
            staff: staffId,
            hospital: hospitalId,
            date: attendanceDate
        });

        const reporter = req.user.role === 'hospital_admin' ? 'admin' : 'receptionist';

        if (!attendance) {
            attendance = new Attendance({
                staff: staffId,
                hospital: hospitalId,
                date: attendanceDate,
                status,
                delayMinutes: status === 'late' ? (Number(delayMinutes) || 0) : 0,
                reportedBy: reporter
            });
        } else {
            attendance.status = status;
            if (status === 'late') {
                attendance.delayMinutes = Number(delayMinutes) || 0;
            } else {
                attendance.delayMinutes = 0;
            }
            attendance.reportedBy = reporter;
        }

        await attendance.save();
        res.status(200).json({ message: 'Attendance status updated successfully', attendance });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get today's attendance summary (Hospital Admin or Receptionist overview)
const getHospitalAttendance = async (req, res) => {
    try {
        const hospitalId = req.user.hospitalId;
        if (!hospitalId) {
            return res.status(400).json({ message: 'Hospital ID not found on user profile' });
        }

        const queryDate = req.query.date ? new Date(req.query.date) : new Date();
        queryDate.setHours(0, 0, 0, 0);

        const records = await Attendance.find({
            hospital: hospitalId,
            date: queryDate
        }).populate('staff', 'firstName lastName email mobile role');

        res.status(200).json({ records });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Self check-out (Staff logs out and registers departure)
const checkOut = async (req, res) => {
    try {
        const hospitalId = req.user.hospitalId;
        const staffId = req.user.id || req.user.sub || req.user._id;

        if (!hospitalId) {
            return res.status(400).json({ message: 'User must belong to a hospital' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({
            staff: staffId,
            hospital: hospitalId,
            date: today
        });

        if (!attendance) {
            return res.status(404).json({ message: 'No attendance record found for today. Please check-in first.' });
        }

        attendance.checkOutTime = new Date();
        await attendance.save();

        res.status(200).json({ message: 'Checked out successfully', attendance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    checkIn,
    checkOut,
    reportDelay,
    markAttendance,
    getHospitalAttendance
};
