const Auth = require('./auth.model');
const env = require('../../config/env');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../../config/jwt');
const crypto = require('crypto');
const notificationEmitter = require('../../services/event.service');
const otpService = require('../patient/otpService');

const registerUser = async (userData) => {
    let { firstName, lastName, profilePicture, email, mobile, password, role, hospitalId } = userData;

    if (!email || !mobile) {
        throw new Error('Both Email and Mobile number are required');
    }

    const existingUser = await Auth.findOne({ $or: [{ email }, { mobile }] });

    if (existingUser) {
        throw new Error('User already exists with given email or mobile');
    }

    // Only patients are automatically active. Staff and admins need approval.
    const autoActiveRoles = ['patient'];
    const isApproved = autoActiveRoles.includes(role);
    const user = new Auth({ firstName, lastName, profilePicture, email, mobile, password, role, hospitalId, isApproved });
    await user.save();

    // Trigger Welcome Notification
    try {
        notificationEmitter.emit('notification:send', {
            recipient: user._id,
            title: 'Welcome to HMS',
            message: `Hello ${firstName}, your account has been successfully created.`,
            type: 'success',
            smsOptions: {
                mobile: mobile,
                message: `Welcome ${firstName} to Hospital Management System! Your account has been successfully created.`,
                channel: 'whatsapp' // Can be 'sms' or 'whatsapp'
            }
        });
    } catch (notifError) {
        console.error('Failed to trigger welcome notification:', notifError);
    }

    return user;
};

const createSuperAdmin = async (secretKey, adminData) => {
    if (secretKey !== env.superAdminSecret) {
        throw new Error('Invalid Super Admin Secret Key');
    }

    let { firstName, lastName, profilePicture, email, mobile, password } = adminData;

    if (!email || !mobile || !password) {
        throw new Error('Email, Mobile number, and Password are required');
    }

    // const existingAdmin = await Auth.findOne({ role: 'super_admin' });
    // if (existingAdmin) {
    //     throw new Error('A Super Admin already exists in the system.');
    // }

    const existingUser = await Auth.findOne({ $or: [{ email }, { mobile }] });

    if (existingUser) {
        throw new Error('User already exists with given email or mobile');
    }

    const user = new Auth({
        firstName,
        lastName,
        profilePicture,
        email,
        mobile,
        password,
        role: 'super_admin',
        isApproved: true
    });

    await user.save();
    return user;
};

const registerStaff = async (adminHospitalId, staffData) => {
    let { firstName, lastName, profilePicture, email, mobile, password, role, specialization, experience, qualifications, shiftStartTime, shiftEndTime, consultationDuration } = staffData;

    if (!email || !mobile || !password) {
        throw new Error('Email, Mobile number, and Password are required');
    }

    const validStaffRoles = ['doctor', 'receptionist', 'pharmacist', 'lab_technician', 'nurse', 'inventory_manager', 'financial_manager'];
    if (!validStaffRoles.includes(role)) {
        throw new Error('Invalid staff role provided');
    }

    const existingUser = await Auth.findOne({ $or: [{ email }, { mobile }] });

    if (existingUser) {
        throw new Error('User already exists with given email or mobile');
    }

    const user = new Auth({
        firstName,
        lastName,
        profilePicture,
        email,
        mobile,
        password,
        role,
        hospitalId: adminHospitalId,
        isApproved: true,
        isProfileComplete: true,
        specialization,
        experience,
        qualifications
    });

    await user.save();

    if (role === 'doctor') {
        const Doctor = require('../doctor/doctor.model');
        const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const schedule = [];
        if (shiftStartTime && shiftEndTime) {
            for (const day of DAYS) {
                schedule.push({ day, startTime: shiftStartTime, endTime: shiftEndTime });
            }
        }
        await Doctor.create({
            user: user._id,
            hospital: adminHospitalId,
            name: `${firstName} ${lastName || ''}`.trim(),
            specialization: specialization || 'General',
            consultationFee: staffData.consultationFee || 500,
            consultationDuration: consultationDuration ? Number(consultationDuration) : 20,
            availabilitySchedule: schedule,
            qualifications: qualifications ? [qualifications] : [],
            experience: experience || 0
        });
    }

    // Trigger Welcome Notification
    try {
        notificationEmitter.emit('notification:send', {
            recipient: user._id,
            title: 'Welcome to HMS Staff',
            message: `Hello ${firstName}, your ${role.replace('_', ' ')} account has been created.`,
            type: 'success',
            smsOptions: {
                mobile: mobile,
                message: `Welcome ${firstName} to Hospital Management System! Your ${role.replace('_', ' ')} account has been successfully created.`,
                channel: 'whatsapp'
            }
        });
    } catch (notifError) {
        console.error('Failed to trigger staff welcome notification:', notifError);
    }

    return user;
};

const getStaff = async (hospitalId, queryParams) => {
    const filter = { role: { $in: ['doctor', 'receptionist', 'pharmacist', 'lab_technician', 'nurse', 'inventory_manager', 'financial_manager'] } };

    if (hospitalId) {
        filter.hospitalId = hospitalId;
    }

    // Hide soft-deleted staff (deleted staff have emails starting with 'deleted_')
    // We want to show both Active (isApproved: true) and Inactive/Deactivated (isApproved: false) staff in the list.
    filter.email = { $not: /^deleted_/ };

    if (queryParams.role) {
        filter.role = queryParams.role;
    }

    if (queryParams.isProfileComplete !== undefined) {
        // queryParams are strings, so parse "false" and "true"
        filter.isProfileComplete = queryParams.isProfileComplete === 'true';
    }

    // Do not send passwords in the response
    const staffMembers = await Auth.find(filter).select('-password');

    // Build summary counts (always scoped to the hospital, ignoring role/isProfileComplete filters)
    const baseFilter = { 
        role: { $in: ['doctor', 'receptionist', 'pharmacist', 'lab_technician', 'nurse', 'inventory_manager', 'financial_manager'] }, 
        email: { $not: /^deleted_/ } 
    };
    if (hospitalId) {
        baseFilter.hospitalId = hospitalId;
    }

    const totalStaff = await Auth.countDocuments(baseFilter);
    const totalDoctors = await Auth.countDocuments({ ...baseFilter, role: 'doctor' });
    const pendingProfiles = await Auth.countDocuments({ ...baseFilter, isProfileComplete: false });
    const activeStaff = await Auth.countDocuments({ ...baseFilter, isProfileComplete: true });

    return {
        staff: staffMembers,
        summary: {
            totalStaff,
            activeStaff,
            totalDoctors,
            pendingProfiles
        }
    };
};

const getStaffById = async (hospitalId, staffId) => {
    const filter = { 
        _id: staffId, 
        role: { $in: ['doctor', 'receptionist', 'pharmacist', 'lab_technician', 'nurse', 'inventory_manager', 'financial_manager'] } 
    };
    
    if (hospitalId) {
        filter.hospitalId = hospitalId;
    }

    const staff = await Auth.findOne(filter).select('-password');
    if (!staff) {
        throw new Error('Staff member not found or you do not have permission to view them');
    }
    return staff;
};

const updateStaff = async (hospitalId, staffId, updateData) => {
    // Prevent updating critical fields directly via this API (like password or role changing to super_admin)
    const allowedUpdates = ['firstName', 'lastName', 'profilePicture', 'email', 'mobile', 'isApproved', 'deactivationReason', 'specialization', 'experience', 'qualifications'];
    const filteredUpdate = {};
    Object.keys(updateData).forEach(key => {
        if (allowedUpdates.includes(key)) {
            filteredUpdate[key] = updateData[key];
        }
    });

    if (filteredUpdate.email || filteredUpdate.mobile) {
        const query = { _id: { $ne: staffId }, $or: [] };
        if (filteredUpdate.email) query.$or.push({ email: filteredUpdate.email });
        if (filteredUpdate.mobile) query.$or.push({ mobile: filteredUpdate.mobile });

        const existingUser = await Auth.findOne(query);
        if (existingUser) {
            throw new Error('Email or mobile number is already in use by another user');
        }
    }

    const staff = await Auth.findOneAndUpdate(
        { _id: staffId, hospitalId, role: { $in: ['doctor', 'receptionist', 'pharmacist', 'lab_technician', 'nurse', 'inventory_manager', 'financial_manager'] } },
        { $set: filteredUpdate },
        { returnDocument: 'after' }
    ).select('-password');

    if (!staff) {
        throw new Error('Staff member not found or you do not have permission to update them');
    }
    return staff;
};

const deleteStaff = async (hospitalId, staffId, deletionReason = '') => {
    // Deactivate the staff and modify email/mobile to allow future re-registration
    const staff = await Auth.findOne(
        { _id: staffId, hospitalId, role: { $in: ['doctor', 'receptionist', 'pharmacist', 'lab_technician', 'nurse', 'inventory_manager', 'financial_manager'] } }
    );

    if (!staff) {
        throw new Error('Staff member not found or you do not have permission to delete them');
    }

    const timestamp = Date.now();
    staff.email = `deleted_${timestamp}_${staff.email}`;
    staff.mobile = `deleted_${timestamp}_${staff.mobile}`;
    staff.isApproved = false;
    staff.deletionReason = deletionReason;

    await staff.save();

    const staffObj = staff.toObject();
    delete staffObj.password;
    return staffObj;
};

const loginUser = async (loginId, password) => {
    // loginId can be email or mobile
    const user = await Auth.findOne({ $or: [{ email: loginId }, { mobile: loginId }] });
    if (!user || !(await user.isPasswordMatch(password))) {
        throw new Error('Incorrect email/mobile or password');
    }
    if (!user.isApproved) {
        throw new Error('Your account is pending Super Admin approval or has been deactivated.');
    }

    if (user.role === 'doctor' && !user.isProfileComplete) {
        throw new Error('Your profile setup is incomplete. Please wait for the Hospital Admin to complete your registration.');
    }

    return user;
};

const requestOtp = async (mobile) => {
    const user = await Auth.findOne({ mobile });
    if (!user) {
        throw new Error('User not found with this mobile number');
    }

    if (!user.isApproved) {
        throw new Error('Your account is pending Super Admin approval or has been deactivated.');
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // Send OTP via SMS
    await otpService.sendOTP(mobile, otp);
    return otp; // Return for testing purposes
};

const loginWithOtp = async (mobile, otp) => {
    const user = await Auth.findOne({ mobile });
    if (!user) {
        throw new Error('User not found');
    }

    if (user.otp !== otp || user.otpExpiresAt < new Date()) {
        throw new Error('Invalid or expired OTP');
    }

    if (!user.isApproved) {
        throw new Error('Your account is pending Super Admin approval or has been deactivated.');
    }

    if (user.role === 'doctor' && !user.isProfileComplete) {
        throw new Error('Your profile setup is incomplete. Please wait for the Hospital Admin to complete your registration.');
    }

    // Clear OTP after successful login
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return user;
};

const generateResetToken = async (email) => {
    const user = await Auth.findOne({ email });
    if (!user) {
        throw new Error('User not found with this email');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Hash the token before saving it to the DB
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    // In a real application, you would send this 'resetToken' (unhashed) via email here
    // e.g., await sendEmail(user.email, resetToken);

    return resetToken;
};

const resetPassword = async (token, newPassword) => {
    // Hash the token from the user to compare with the one in DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await Auth.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new Error('Invalid or expired password reset token');
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return user;
};

const changePassword = async (userId, oldPassword, newPassword) => {
    const user = await Auth.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    if (!(await user.isPasswordMatch(oldPassword))) {
        throw new Error('Incorrect old password');
    }

    user.password = newPassword;
    await user.save();
    return user;
};

const generateTokens = async (user, oldRefreshToken = null) => {
    const payload = { sub: user._id, role: user.role, profilePicture: user.profilePicture };
    if (user.hospitalId) {
        payload.hospitalId = user.hospitalId;
    }
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    let refreshTokens = user.refreshTokens || [];

    // Remove the old token if refreshing
    if (oldRefreshToken) {
        refreshTokens = refreshTokens.filter(t => t !== oldRefreshToken);
    }

    // Add new token
    refreshTokens.push(refreshToken);

    // Keep a maximum of 5 active devices
    if (refreshTokens.length > 5) {
        refreshTokens = refreshTokens.slice(-5);
    }

    user.refreshTokens = refreshTokens;
    await user.save();

    return { accessToken, refreshToken };
};

const refreshAuthToken = async (refreshToken) => {
    try {
        const decoded = verifyRefreshToken(refreshToken);
        const user = await Auth.findById(decoded.sub);

        if (!user || !user.isApproved) {
            throw new Error('Your account is pending Super Admin approval or has been deactivated.');
        }

        let isValid = false;
        if (user.refreshTokens && user.refreshTokens.includes(refreshToken)) {
            isValid = true;
        } else if (user.refreshToken === refreshToken) {
            // Backward compatibility
            isValid = true;
        }

        if (!isValid) {
            throw new Error('Invalid refresh token');
        }

        return await generateTokens(user, refreshToken);
    } catch (error) {
        throw new Error(error.message || 'Invalid or expired refresh token');
    }
};

const logoutUser = async (userId, refreshTokenToLogout) => {
    const user = await Auth.findById(userId);
    if (!user) throw new Error('User not found');

    if (refreshTokenToLogout) {
        // Logout from specific device
        if (user.refreshTokens) {
            user.refreshTokens = user.refreshTokens.filter(t => t !== refreshTokenToLogout);
        }
        if (user.refreshToken === refreshTokenToLogout) {
            user.refreshToken = null;
        }
    } else {
        // Fallback: Logout from all devices
        user.refreshTokens = [];
        user.refreshToken = null;
    }
    await user.save();
};

const approveUser = async (userId) => {
    const user = await Auth.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    user.isApproved = true;
    await user.save();

    if (user.role === 'hospital_admin' && user.hospitalId) {
        const Hospital = require('../hospital/hospital.model');
        await Hospital.findByIdAndUpdate(user.hospitalId, { isActive: true });
    }

    return user;
};

const getPendingAdmins = async () => {
    return await Auth.find({ role: 'hospital_admin', isApproved: false }).select('-password').populate('hospitalId');
};

module.exports = {
    registerUser,
    createSuperAdmin,
    registerStaff,
    getStaff,
    getStaffById,
    updateStaff,
    deleteStaff,
    loginUser,
    requestOtp,
    loginWithOtp,
    generateResetToken,
    resetPassword,
    changePassword,
    generateTokens,
    refreshAuthToken,
    logoutUser,
    approveUser,
    getPendingAdmins
};

