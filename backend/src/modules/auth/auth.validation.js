const registerValidation = (req, res, next) => {
    const { firstName, email, mobile, password, role } = req.body;
    if (!firstName) {
        return res.status(400).json({ message: 'First name is required' });
    }
    if (!email || !mobile) {
        return res.status(400).json({ message: 'Both email and mobile are required' });
    }
    if (mobile && !/^[6-9]\d{9}$/.test(mobile)) {
        return res.status(400).json({ message: 'Mobile number must be a valid 10-digit Indian number' });
    }
    if (password && password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const publicRoles = ['patient', 'hospital_admin'];
    if (role && !publicRoles.includes(role)) {
        return res.status(400).json({
            message: `Public registration is only allowed for roles: ${publicRoles.join(', ')}.`
        });
    }

    const staffRoles = ['doctor', 'receptionist', 'pharmacist', 'lab_technician', 'nurse', 'inventory_manager', 'financial_manager'];
    if (staffRoles.includes(role) && !req.body.hospitalId) {
        return res.status(400).json({ message: 'hospitalId is required when registering as hospital staff' });
    }

    next();
};


const registerStaffValidation = (req, res, next) => {
    const { firstName, email, mobile, password, role } = req.body;
    if (!firstName) {
        return res.status(400).json({ message: 'First name is required' });
    }
    if (!email || !mobile) {
        return res.status(400).json({ message: 'Both email and mobile are required' });
    }
    if (mobile && !/^[6-9]\d{9}$/.test(mobile)) {
        return res.status(400).json({ message: 'Mobile number must be a valid 10-digit Indian number' });
    }
    if (!role) {
        return res.status(400).json({ message: 'Role is required to register staff' });
    }
    const validStaffRoles = ['doctor', 'receptionist', 'pharmacist', 'lab_technician', 'nurse', 'inventory_manager', 'financial_manager'];
    if (!validStaffRoles.includes(role)) {
        return res.status(400).json({ message: `Role must be one of: ${validStaffRoles.join(', ')}` });
    }
    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password is required and must be at least 6 characters' });
    }
    next();
};


const loginValidation = (req, res, next) => {
    // Frontend developer backward compatibility: Check both 'loginId' and 'email'
    const loginId = req.body.loginId || req.body.email;
    const password = req.body.password;

    if (!loginId || !password) {
        return res.status(400).json({ message: 'Email/Mobile and password are required' });
    }

    // Normalize it so the controller always gets 'loginId'
    req.body.loginId = loginId;
    next();
};

const requestOtpValidation = (req, res, next) => {
    const { mobile } = req.body;
    if (!mobile) {
        return res.status(400).json({ message: 'Mobile number is required' });
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
        return res.status(400).json({ message: 'Mobile number must be a valid 10-digit Indian number' });
    }
    next();
};

const loginWithOtpValidation = (req, res, next) => {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
        return res.status(400).json({ message: 'Mobile number and OTP are required' });
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
        return res.status(400).json({ message: 'Mobile number must be a valid 10-digit Indian number' });
    }
    next();
};

const forgotPasswordValidation = (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    next();
};

const resetPasswordValidation = (req, res, next) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    next();
};

const changePasswordValidation = (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Old password and new password are required' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    if (oldPassword === newPassword) {
        return res.status(400).json({ message: 'New password must be different from old password' });
    }
    next();
};


module.exports = {
    registerValidation,
    registerStaffValidation,
    loginValidation,
    requestOtpValidation,
    loginWithOtpValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    changePasswordValidation
};
