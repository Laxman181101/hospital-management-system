const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
    testName: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['Blood', 'Urine', 'X-Ray', 'MRI', 'CT Scan', 'Ultrasound', 'Pathology', 'Other'],
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    turnaroundTime: {
        type: String, // e.g., '24 hours', '2 days'
        default: '24 hours'
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    }
}, { timestamps: true });

const LabTest = mongoose.model('LabTest', labTestSchema);

module.exports = LabTest;
