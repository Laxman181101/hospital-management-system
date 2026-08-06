const mongoose = require('mongoose');

const ambulanceDispatchSchema = new mongoose.Schema({
    ambulanceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ambulance',
        required: [true, 'Ambulance ID is required']
    },
    location: {
        type: String,
        required: [true, 'Location is required']
    },
    dropLocation: {
        type: String
    },
    dispatchType: {
        type: String,
        enum: ['Emergency', 'Referral'],
        default: 'Emergency'
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient'
    },
    callerName: {
        type: String,
        trim: true
    },
    callerPhone: {
        type: String,
        trim: true
    },
    dispatchTime: {
        type: Date,
        default: Date.now
    },
    returnTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['En-route', 'Returned'],
        default: 'En-route'
    }
}, { timestamps: true });

module.exports = mongoose.model('AmbulanceDispatch', ambulanceDispatchSchema);
