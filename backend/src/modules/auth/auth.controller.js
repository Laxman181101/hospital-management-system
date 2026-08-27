const authService = require('./auth.service');

const register = async (req, res) => {
    try {
        const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
        if (file) {
            req.body.profilePicture = file.path; // from cloudinary
        }

        const user = await authService.registerUser(req.body);
        
        // Auto-create Patient profile if the role is patient
        if (user.role === 'patient') {
            const Patient = require('../patient/patient.model');
            // Check if patient profile already exists to prevent duplicates (e.g. if called from patient.controller)
            const existingPatient = await Patient.findOne({ user: user._id });
            if (!existingPatient) {
                await Patient.create({ 
                    user: user._id,
                    hospitalId: req.body.hospitalId,
                    name: req.body.name || (req.body.firstName ? `${req.body.firstName} ${req.body.lastName || ''}`.trim() : undefined),
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    mobile: req.body.mobile,
                    email: req.body.email
                });
            }
        }
        
        const tokens = await authService.generateTokens(user);
        res.status(201).json({ user, tokens });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const createSuperAdmin = async (req, res) => {
    try {
        const { secretKey, ...adminData } = req.body;
        if (!secretKey) {
            return res.status(400).json({ message: 'Secret Key is required' });
        }
        const user = await authService.createSuperAdmin(secretKey, adminData);
        res.status(201).json({ message: 'Super Admin created successfully', user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


const registerStaff = async (req, res) => {
    try {
        const adminHospitalId = req.user.hospitalId;
        if (!adminHospitalId) {
            return res.status(400).json({ message: 'Hospital Admin must belong to a hospital to register staff' });
        }

        const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
        if (file) {
            req.body.profilePicture = file.path;
        }

        const staff = await authService.registerStaff(adminHospitalId, req.body);
        res.status(201).json({ message: 'Staff registered successfully', staff });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getStaff = async (req, res) => {
    try {
        let targetHospitalId = req.user.hospitalId;

        if (req.user.role === 'super_admin') {
            targetHospitalId = req.query.hospitalId || null;
        }

        if (req.user.role !== 'super_admin' && !targetHospitalId) {
            return res.status(400).json({ message: 'Hospital Admin must belong to a hospital' });
        }

        const result = await authService.getStaff(targetHospitalId, req.query);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getStaffById = async (req, res) => {
    try {
        let targetHospitalId = req.user.hospitalId;

        if (req.user.role === 'super_admin') {
            targetHospitalId = req.query.hospitalId || null;
        }

        if (req.user.role !== 'super_admin' && !targetHospitalId) {
            return res.status(400).json({ message: 'Hospital Admin must belong to a hospital' });
        }

        const staff = await authService.getStaffById(targetHospitalId, req.params.id);
        res.status(200).json({ staff });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateStaff = async (req, res) => {
    try {
        const adminHospitalId = req.user.hospitalId;
        if (!adminHospitalId) {
            return res.status(400).json({ message: 'Hospital Admin must belong to a hospital' });
        }
        const staff = await authService.updateStaff(adminHospitalId, req.params.id, req.body);
        res.status(200).json({ message: 'Staff updated successfully', staff });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteStaff = async (req, res) => {
    try {
        const adminHospitalId = req.user.hospitalId;
        const deletionReason = req.body.deletionReason || '';
        if (!adminHospitalId) {
            return res.status(400).json({ message: 'Hospital Admin must belong to a hospital' });
        }
        const staff = await authService.deleteStaff(adminHospitalId, req.params.id, deletionReason);
        res.status(200).json({ message: 'Staff deleted successfully', staff });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


const login = async (req, res) => {
    try {
        const { loginId, password } = req.body;
        const user = await authService.loginUser(loginId, password);
        const tokens = await authService.generateTokens(user);
        res.status(200).json({ user, tokens });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

const requestOtp = async (req, res) => {
    try {
        const { mobile } = req.body;
        // In production, the service should send the OTP via SMS, do not return it here.
        const otp = await authService.requestOtp(mobile);
        const response = { message: 'OTP sent successfully to your registered mobile number' };
        if (process.env.NODE_ENV === 'development') {
            response.otp = otp;
        }
        res.status(200).json(response); 
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const loginWithOtp = async (req, res) => {
    try {
        const { mobile, otp } = req.body;
        const user = await authService.loginWithOtp(mobile, otp);
        const tokens = await authService.generateTokens(user);
        res.status(200).json({ user, tokens });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        // In production, the service should send this token via email, do not return it here.
        const resetToken = await authService.generateResetToken(email);
        const response = { message: 'If that email is registered, a password reset link has been sent.' };
        if (process.env.NODE_ENV === 'development') {
            response.resetToken = resetToken;
        }
        res.status(200).json(response);
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            res.status(400).json({ message: error.message });
        } else {
            res.status(200).json({ message: 'If that email is registered, a password reset link has been sent.' });
        }
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        await authService.resetPassword(token, newPassword);
        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const userId = req.user.sub || req.user.id || req.user._id;
        const { oldPassword, newPassword } = req.body;
        await authService.changePassword(userId, oldPassword, newPassword);
        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


const logout = async (req, res) => {
    try {
        const userId = req.user.sub || req.user.id || req.user._id;
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token is required to logout' });
        }

        await authService.logoutUser(userId, refreshToken);
        res.status(200).json({ message: 'Logged out from the device successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error logging out' });
    }
};

const refreshToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Refresh token is required' });
        }
        const tokens = await authService.refreshAuthToken(token);
        res.status(200).json({ tokens });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

const approveUser = async (req, res) => {
    try {
        const user = await authService.approveUser(req.params.id);
        res.status(200).json({ message: 'User approved successfully', user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getPendingAdmins = async (req, res) => {
    try {
        const admins = await authService.getPendingAdmins();
        res.status(200).json({ admins });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProfilePhoto = async (req, res) => {
    try {
        const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
        if (!file) {
            return res.status(400).json({ message: 'Please upload an image file' });
        }
        
        const Auth = require('./auth.model');
        const userId = req.user.sub || req.user._id || req.user.id;
        const user = await Auth.findByIdAndUpdate(
            userId,
            { profilePicture: file.path },
            { new: true }
        );

        // Sync with specific profile models if they exist
        if (user) {
            if (user.role === 'patient') {
                const Patient = require('../patient/patient.model');
                await Patient.findOneAndUpdate({ user: userId }, { photo: file.path });
            } else if (user.role === 'doctor') {
                const Doctor = require('../doctor/doctor.model');
                await Doctor.findOneAndUpdate({ user: userId }, { profilePicture: file.path });
            }
        }

        res.status(200).json({ 
            success: true,
            message: 'Profile photo updated successfully', 
            profilePicture: user.profilePicture 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    register,
    createSuperAdmin,
    registerStaff,
    getStaff,
    getStaffById,
    updateStaff,
    deleteStaff,
    login,
    requestOtp,
    loginWithOtp,
    forgotPassword,
    resetPassword,
    changePassword,
    logout,
    refreshToken,
    approveUser,
    getPendingAdmins,
    updateProfilePhoto
};
