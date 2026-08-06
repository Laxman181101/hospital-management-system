const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const authSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        trim: true,
        default: '',
    },
    profilePicture: {
        type: String,
        default: '',
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: false,
        minlength: 6,
    },
    role: {
        type: String,
        enum: ['super_admin', 'hospital_admin', 'doctor', 'patient', 'receptionist', 'pharmacist', 'lab_technician', 'nurse', 'inventory_manager', 'financial_manager'],
        default: 'patient',
    },
    specialization: {
        type: String,
        trim: true,
    },
    experience: {
        type: Number,
        default: 0,
    },
    qualifications: {
        type: String,
        trim: true,
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
    },
    isApproved: {
        type: Boolean,
        default: true
    },
    deactivationReason: {
        type: String,
        default: ''
    },
    deletionReason: {
        type: String,
        default: ''
    },
    isProfileComplete: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String,
    },
    otpExpiresAt: {
        type: Date,
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },
    refreshToken: {
        type: String,
    },
    refreshTokens: {
        type: [String],
        default: []
    }
}, { timestamps: true });

authSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

authSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.otp;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpires;
    delete user.refreshToken;
    delete user.refreshTokens;
    return user;
};

authSchema.methods.isPasswordMatch = async function (password) {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
};

const Auth = mongoose.model('Auth', authSchema);
module.exports = Auth;
