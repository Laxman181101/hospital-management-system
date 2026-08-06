const Leave = require('./leave.model');

// Apply for leave (Staff member)
const applyLeave = async (req, res) => {
    const { startDate, endDate, leaveType, reason } = req.body;
    try {
        const hospitalId = req.user.hospitalId;
        if (!hospitalId) {
            return res.status(400).json({ message: 'User must be associated with a hospital to apply for leave' });
        }

        const leave = new Leave({
            staff: req.user.id || req.user.sub || req.user._id,
            hospital: hospitalId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            leaveType,
            reason,
            status: 'approved' // Automatically approved for convenience in testing/basic flow, or can default to pending
        });

        await leave.save();
        res.status(201).json({ message: 'Leave applied successfully', leave });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get leaves for hospital (Admin sees all, staff sees their own)
const getHospitalLeaves = async (req, res) => {
    try {
        const hospitalId = req.user.hospitalId;
        if (!hospitalId) {
            return res.status(400).json({ message: 'Hospital ID not found on user profile' });
        }

        const query = { hospital: hospitalId };
        
        // Non-admin can only see their own leaves
        if (req.user.role !== 'hospital_admin' && req.user.role !== 'super_admin') {
            query.staff = req.user.id || req.user.sub || req.user._id;
        }

        const leaves = await Leave.find(query).populate('staff', 'firstName lastName email mobile role');
        res.status(200).json({ leaves });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Approve/Reject leave request (Admin only)
const approveRejectLeave = async (req, res) => {
    const { status } = req.body;
    try {
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const leave = await Leave.findOne({
            _id: req.params.id,
            hospital: req.user.hospitalId
        });

        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found or unauthorized' });
        }

        leave.status = status;
        await leave.save();

        res.status(200).json({ message: `Leave status updated to ${status}`, leave });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    applyLeave,
    getHospitalLeaves,
    approveRejectLeave
};
