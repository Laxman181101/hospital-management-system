const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema({
    wardName: {
        type: String, // e.g., 'ICU', 'General Ward A', 'Maternity Ward'
        required: true,
        trim: true
    },
    wardType: {
        type: String,
        enum: ['General', 'ICU', 'Private', 'Semi-Private', 'Maternity', 'Pediatric', 'Emergency', 'Other'],
        required: true
    },
    totalBeds: {
        type: Number,
        required: true,
        min: 1
    },
    availableBeds: {
        type: Number,
        required: true,
        min: 0
    },
    pricePerDay: {
        type: Number,
        required: true,
        min: 0
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    }
}, { timestamps: true });

const Ward = mongoose.model('Ward', wardSchema);

module.exports = Ward;
