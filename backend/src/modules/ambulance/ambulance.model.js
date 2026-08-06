const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema({
    vehicleNumber: {
        type: String,
        required: [true, 'Vehicle number is required'],
        unique: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['Basic', 'ALS', 'ICU'],
        default: 'Basic'
    },
    status: {
        type: String,
        enum: ['Available', 'On-Duty', 'Maintenance'],
        default: 'Available'
    },
    driverName: {
        type: String,
        trim: true
    },
    driverPhone: {
        type: String,
        trim: true
    },
    currentDispatch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AmbulanceDispatch',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Ambulance', ambulanceSchema);
