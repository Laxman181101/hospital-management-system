const mongoose = require('mongoose');

const operationTheaterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['General', 'Cardiac', 'Ortho', 'Gynae', 'ENT', 'Other'],
        required: true
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    },
    status: {
        type: String,
        enum: ['Available', 'Occupied', 'Maintenance', 'Cleaning'],
        default: 'Available'
    },
    capacity: {
        type: Number,
        default: 1
    },
    description: {
        type: String,
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model('OperationTheater', operationTheaterSchema);
