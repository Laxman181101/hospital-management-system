const mongoose = require('mongoose');

const bedAllocationSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    patientName: {
        type: String,
        trim: true
    },
    ward: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ward',
        required: true
    },
    bedNumber: {
        type: String, // e.g., 'Bed-101'
        required: true,
        trim: true
    },
    admissionDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    dischargeDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['Pending', 'Admitted', 'Discharge Requested', 'Discharged', 'Cancelled'],
        default: 'Admitted'
    },
    primaryNurse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth' // The nurse assigned to this patient
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth' // The main doctor assigned
    },
    doctorInCharge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth'
    },
    primaryDoctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth'
    },
    admissionRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdmissionRequest'
    },
    depositTransaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },
    dischargeNotes: {
        type: String,
        trim: true
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    }
}, { timestamps: true });

const BedAllocation = mongoose.model('BedAllocation', bedAllocationSchema);

module.exports = BedAllocation;
