const mongoose = require('mongoose');

const requestedTestSchema = new mongoose.Schema({
    test: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LabTest',
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Sample Collected', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    resultNotes: {
        type: String,
        default: ''
    },
    reportFileUrl: {
        type: String, // PDF or Image URL of the test report
        default: ''
    },
    reportUrl: {
        type: String,
        default: ''
    },
    filePath: {
        type: String,
        default: ''
    }
}, { _id: true }); // Keep _id to easily update specific test within request

const labRequestSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth' // Optional: if prescribed by a doctor
    },
    tests: [requestedTestSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentStatus: {
        type: String,
        enum: ['Unpaid', 'Paid'],
        default: 'Unpaid'
    },
    patientType: {
        type: String,
        enum: ['OPD', 'IPD'],
        default: 'OPD'
    },
    overallStatus: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    labTechnician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth' // Who handled the overall request
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    }
}, { timestamps: true });

// Pre-save hook to calculate overall status based on individual tests
labRequestSchema.pre('save', function() {
    if (this.tests && this.tests.length > 0) {
        const allCompleted = this.tests.every(t => t.status === 'Completed' || t.status === 'Cancelled');
        const anyInProgress = this.tests.some(t => t.status === 'Sample Collected');
        const allCancelled = this.tests.every(t => t.status === 'Cancelled');

        if (allCancelled) {
            this.overallStatus = 'Cancelled';
        } else if (allCompleted) {
            this.overallStatus = 'Completed';
        } else if (anyInProgress) {
            this.overallStatus = 'In Progress';
        } else {
            this.overallStatus = 'Pending';
        }
    }
});

const LabRequest = mongoose.model('LabRequest', labRequestSchema);

module.exports = LabRequest;
