const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    staff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth', // Reference to staff auth account
        required: true
    },
    hospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: () => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            return d;
        }
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'on_leave'],
        default: 'absent'
    },
    checkInTime: {
        type: Date
    },
    checkOutTime: {
        type: Date
    },
    delayMinutes: {
        type: Number,
        default: 0
    },
    reportedBy: {
        type: String,
        enum: ['self', 'receptionist', 'admin'],
        default: 'self'
    }
}, { timestamps: true });

// Ensure unique record per staff, hospital, and date
attendanceSchema.index({ staff: 1, hospital: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
