const Patient = require('./patient.model');
const Auth = require('../auth/auth.model');
const authService = require('../auth/auth.service');
const Doctor = require('../doctor/doctor.model');
const Consultation = require('../consultation/consultation.model');
const Prescription = require('../prescription/prescription.model');
const bcrypt = require('bcryptjs');

// Utility functions for PII masking
const maskMobile = (mobile) => {
    if (!mobile) return mobile;
    const str = mobile.toString();
    if (str.length < 6) return str;
    const firstPart = str.slice(0, 4);
    const lastPart = str.slice(-4);
    const middleMask = 'X'.repeat(Math.max(0, str.length - 8));
    return `${firstPart}${middleMask}${lastPart}`;
};

const maskEmail = (email) => {
    if (!email) return email;
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const maskedName = name.slice(0, 2) + 'X'.repeat(Math.max(0, name.length - 2));
    return `${maskedName}@${parts[1]}`;
};

const register = async (req, res) => {
    try {
        const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);

        const { email, mobile, password, name, firstName, lastName, gender, dateOfBirth, bloodGroup, address, emergencyContact, symptoms, hospitalId } = req.body;
        
        const finalFirstName = firstName || name?.split(' ')[0] || 'Unknown';
        const finalLastName = lastName || name?.split(' ').slice(1).join(' ') || '';
        // 1. Create authentication user account
        const user = await authService.registerUser({
            firstName: finalFirstName,
            lastName: finalLastName,
            email,
            mobile,
            password,
            profilePicture: file ? file.path : '',
            role: 'patient',
            hospitalId
        });

        const hashedPassword = await bcrypt.hash(password, 10);

        const otpService = require('./otpService');
        const otp = otpService.generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // 2. Create the associated Patient profile
        const patientName = firstName ? `${firstName} ${lastName || ''}`.trim() : 'Unknown';
        const patient = new Patient({
            user: user._id,
            hospitalId,
            name: patientName || name,
            firstName: finalFirstName,
            lastName: finalLastName,
            mobile,
            email,
            password: hashedPassword,
            gender,
            dateOfBirth,
            bloodGroup,
            address,
            emergencyContact,
            symptoms,
            otp,
            otpExpiry,
            registrationMethod: 'self'
        });

        await patient.save();

        // Send OTP
        try {
            await otpService.sendOTP(mobile, otp);
        } catch (otpError) {
            console.error('[Registration OTP Error] Failed to send register welcome SMS:', otpError.message);
        }

        // 3. Generate auth token
        const tokens = await authService.generateTokens(user);

        res.status(201).json({
            message: 'Patient registered successfully',
            user: {
                _id: user._id,
                email: user.email,
                mobile: user.mobile,
                role: user.role
            },
            patient,
            tokens,
            patientId: patient._id // returned for backward compatibility with integration tests
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const verifyOtp = async (req, res) => {
    const { patientId, otp } = req.body;
    try {
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        if (patient.otp !== otp || patient.otpExpiry < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        patient.isVerified = true;
        patient.otp = undefined;
        patient.otpExpiry = undefined;
        await patient.save();

        res.status(200).json({ message: 'OTP verified successfully', isVerified: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Login Patient
const login = async (req, res) => {
    const { email, mobile, loginId, password } = req.body;
    const identifier = loginId || email || mobile;
    try {
        const user = await authService.loginUser(identifier, password);

        if (user.role !== 'patient') {
            return res.status(403).json({ message: 'Forbidden: Access denied. User is not registered as a patient.' });
        }

        const patient = await Patient.findOne({ user: user._id });
        const tokens = await authService.generateTokens(user);

        res.status(200).json({
            message: 'Login successful',
            user: {
                _id: user._id,
                email: user.email,
                mobile: user.mobile,
                role: user.role
            },
            patient,
            tokens,
            token: tokens.accessToken
        });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

// Get Patient Profile (Self or Admin/Doctor)
const getProfile = async (req, res) => {
    try {
        let userId = req.user.sub; // From protect middleware

        // If an ID parameter is provided and the logged-in user is an admin or doctor, query that specific patient
        if (req.params.id && ['super_admin', 'hospital_admin', 'doctor', 'receptionist', 'financial_manager', 'pharmacist'].includes(req.user.role)) {
            const patient = await Patient.findById(req.params.id).populate('user', 'email mobile role').lean();
            if (!patient) {
                return res.status(404).json({ message: 'Patient profile not found' });
            }
            
            // Mask data for non-medical staff
            const role = req.user.role;
            if (['receptionist', 'financial_manager', 'pharmacist'].includes(role)) {
                if (['financial_manager', 'pharmacist'].includes(role)) {
                    if (patient.mobile) patient.mobile = maskMobile(patient.mobile);
                    if (patient.email) patient.email = maskEmail(patient.email);
                    if (patient.user && patient.user.mobile) patient.user.mobile = maskMobile(patient.user.mobile);
                    if (patient.user && patient.user.email) patient.user.email = maskEmail(patient.user.email);
                }
                
                delete patient.medicalHistory;
                delete patient.reports;
                delete patient.prescriptions;
            }
            
            return res.status(200).json(patient);
        }

        // Otherwise, return own profile
        const patient = await Patient.findOne({ user: userId }).populate('user', 'email mobile role');
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }
        res.status(200).json(patient);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Patient Profile
const updateProfile = async (req, res) => {
    const { name, firstName, lastName, email, mobile, gender, dateOfBirth, bloodGroup, address, emergencyContact, symptoms } = req.body;
    try {
        const userId = req.user.sub;
        const patient = await Patient.findOne({ user: userId });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        // Update Auth model if email or mobile are provided
        if (email !== undefined || mobile !== undefined) {
            const authUser = await Auth.findById(patient.user);
            if (authUser) {
                const query = { _id: { $ne: authUser._id }, $or: [] };
                if (email !== undefined) query.$or.push({ email });
                if (mobile !== undefined) query.$or.push({ mobile });
                
                if (query.$or.length > 0) {
                    const existingUser = await Auth.findOne(query);
                    if (existingUser) {
                        return res.status(400).json({ message: 'Email or mobile number is already in use by another user' });
                    }
                }

                if (email !== undefined) {
                    authUser.email = email;
                    patient.email = email;
                }
                if (mobile !== undefined) {
                    authUser.mobile = mobile;
                    patient.mobile = mobile;
                }
                await authUser.save();
            }
        }

        // Update fields if provided
        if (name !== undefined) patient.name = name;
        if (firstName !== undefined) patient.firstName = firstName;
        if (lastName !== undefined) patient.lastName = lastName;
        if (gender !== undefined) patient.gender = gender;
        if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth;
        if (bloodGroup !== undefined) patient.bloodGroup = bloodGroup;
        if (address) patient.address = { ...patient.address, ...address };
        if (emergencyContact) patient.emergencyContact = { ...patient.emergencyContact, ...emergencyContact };
        if (symptoms !== undefined) patient.symptoms = symptoms;
        
        if (req.file && req.file.path) {
            patient.photo = req.file.path;
            const authUser = await Auth.findById(patient.user);
            if (authUser) {
                authUser.profilePicture = req.file.path;
                await authUser.save();
            }
        }

        await patient.save();
        res.status(200).json({ message: 'Profile updated successfully', patient });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get Medical History
const getMedicalHistory = async (req, res) => {
    try {
        let patient;
        const isStaff = ['super_admin', 'hospital_admin', 'doctor'].includes(req.user.role);

        if (req.params.id && isStaff) {
            patient = await Patient.findById(req.params.id);
        } else {
            patient = await Patient.findOne({ user: req.user.sub });
        }

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        res.status(200).json(patient.medicalHistory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add Medical History Record
const addMedicalHistory = async (req, res) => {
    const { condition, diagnosedDate, status, notes } = req.body;
    try {
        // Can be added by patient themselves or doctor/admin
        let patient;
        const isStaff = ['super_admin', 'hospital_admin', 'doctor'].includes(req.user.role);

        if (req.params.id && isStaff) {
            patient = await Patient.findById(req.params.id);
        } else {
            patient = await Patient.findOne({ user: req.user.sub });
        }

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        patient.medicalHistory.push({ condition, diagnosedDate, status, notes });
        await patient.save();

        res.status(201).json({ message: 'Medical history updated successfully', medicalHistory: patient.medicalHistory });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Upload Report
const uploadReport = async (req, res) => {
    const { title } = req.body;
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }
        if (!title) {
            return res.status(400).json({ message: 'Report title is required' });
        }

        const patient = await Patient.findOne({ user: req.user.sub });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const filePath = `/uploads/${req.file.filename}`;
        patient.reports.push({ title, filePath });
        await patient.save();

        res.status(201).json({ message: 'Report uploaded successfully', reports: patient.reports });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get Appointment History
const getAppointments = async (req, res) => {
    try {
        let patient;
        const isStaff = ['super_admin', 'hospital_admin', 'doctor'].includes(req.user.role);

        if (req.params.id && isStaff) {
            patient = await Patient.findById(req.params.id);
        } else {
            patient = await Patient.findOne({ user: req.user.sub });
        }

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        res.status(200).json(patient.appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add Appointment Entry (e.g. for keeping history)
const addAppointment = async (req, res) => {
    const { doctorName, doctorId, date, status, notes, type } = req.body;
    try {
        let patient;
        const isStaff = ['super_admin', 'hospital_admin', 'doctor'].includes(req.user.role);

        if (req.params.id && isStaff) {
            patient = await Patient.findById(req.params.id);
        } else {
            patient = await Patient.findOne({ user: req.user.sub });
        }

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        let meetingLink = '';
        if (type === 'video') {
            const crypto = require('crypto');
            const uniqueHash = crypto.randomBytes(4).toString('hex');
            meetingLink = `https://meet.jit.si/HMS-Video-${uniqueHash}-${Date.now()}`;
        }

        patient.appointments.push({ doctorName, doctorId, date, status, notes, type, meetingLink });
        await patient.save();

        const newAppt = patient.appointments[patient.appointments.length - 1];
        res.status(201).json({ 
            message: 'Appointment added successfully', 
            appointments: patient.appointments,
            appointment: newAppt
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const cancelAppointment = async (req, res) => {
    try {
        const userId = req.user.sub;
        const patient = await Patient.findOne({ user: userId });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const appointment = patient.appointments.id(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        appointment.status = 'cancelled';
        await patient.save();

        res.status(200).json({ message: 'Appointment cancelled successfully', appointment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Prescription History
const getPrescriptions = async (req, res) => {
    try {
        let patient;
        const isStaff = ['super_admin', 'hospital_admin', 'doctor', 'pharmacist'].includes(req.user.role);

        if (req.params.id && isStaff) {
            patient = await Patient.findById(req.params.id);
        } else {
            patient = await Patient.findOne({ user: req.user.sub });
        }

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        res.status(200).json(patient.prescriptions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add Prescription Entry (Usually done by a doctor/admin)
const addPrescription = async (req, res) => {
    const { doctorName, date, medicines, instructions } = req.body;
    try {
        let patient;
        // Limit this to doctor/admin only
        const isStaff = ['super_admin', 'hospital_admin', 'doctor'].includes(req.user.role);
        if (!isStaff) {
            return res.status(403).json({ message: 'Forbidden: Only doctors or admins can prescribe medication.' });
        }

        if (req.params.id) {
            patient = await Patient.findById(req.params.id);
        } else {
            return res.status(400).json({ message: 'Patient profile ID is required to prescribe' });
        }

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        patient.prescriptions.push({ doctorName, date, medicines, instructions });
        await patient.save();

        res.status(201).json({ message: 'Prescription added successfully', prescriptions: patient.prescriptions });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getAllPatients = async (req, res) => {
    try {
        const role = req.user.role;
        if (role === 'super_admin' || role === 'hospital_admin' || role === 'receptionist' || role === 'financial_manager' || role === 'pharmacist') {
            const filter = { isDeleted: { $ne: true } };
            const conditions = [];

            if (role !== 'super_admin' && req.user.hospitalId) {
                conditions.push({
                    $or: [
                        { hospitalId: req.user.hospitalId },
                        { registrationMethod: 'self' },
                        { hospitalId: null }
                    ]
                });
            } else if (req.query.hospitalId) {
                conditions.push({ hospitalId: req.query.hospitalId });
            }

            if (req.query.name) {
                const nameRegex = new RegExp(req.query.name, 'i');
                conditions.push({
                    $or: [
                        { name: nameRegex },
                        { firstName: nameRegex },
                        { lastName: nameRegex }
                    ]
                });
            }

            if (conditions.length > 0) {
                filter.$and = conditions;
            }

            let query = Patient.find(filter).populate('user', 'email mobile role');
            
            if (req.query.all !== 'true') {
                const limit = parseInt(req.query.limit, 10);
                if (!isNaN(limit) && limit > 0) {
                    query = query.limit(limit);
                }
                const skip = parseInt(req.query.skip, 10);
                if (!isNaN(skip) && skip > 0) {
                    query = query.skip(skip);
                }
            }

            const patients = await query.lean();

            let maskedPatients = patients;
            if (['receptionist', 'financial_manager', 'pharmacist'].includes(role)) {
                maskedPatients = patients.map(p => {
                    if (['financial_manager', 'pharmacist'].includes(role)) {
                        if (p.mobile) p.mobile = maskMobile(p.mobile);
                        if (p.email) p.email = maskEmail(p.email);
                        if (p.user && p.user.mobile) p.user.mobile = maskMobile(p.user.mobile);
                        if (p.user && p.user.email) p.user.email = maskEmail(p.user.email);
                    }
                    
                    delete p.medicalHistory;
                    delete p.reports;
                    delete p.prescriptions;
                    return p;
                });
            }

            return res.status(200).json(maskedPatients);
        } else if (role === 'doctor') {
            const doctor = await Doctor.findOne({ user: req.user.sub });
            if (!doctor) {
                return res.status(404).json({ message: 'Doctor profile not found' });
            }
            let query = Patient.find({
                isDeleted: { $ne: true },
                $or: [
                    { 'appointments.doctorName': doctor.name },
                    { 'prescriptions.doctorName': doctor.name }
                ]
            }).populate('user', 'email mobile role');

            if (req.query.all !== 'true') {
                const limit = parseInt(req.query.limit, 10);
                if (!isNaN(limit) && limit > 0) {
                    query = query.limit(limit);
                }
                const skip = parseInt(req.query.skip, 10);
                if (!isNaN(skip) && skip > 0) {
                    query = query.skip(skip);
                }
            }

            const patients = await query;
            return res.status(200).json(patients);
        } else {
            return res.status(403).json({ message: 'Forbidden: Access denied' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin manually register patient (walk-in)
const manualRegister = async (req, res) => {
    try {
        const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);

        const {
            firstName, lastName, mobile, email, gender, dateOfBirth,
            bloodGroup, address, emergencyContact, symptoms, hospitalId: bodyHospitalId, password
        } = req.body;

        const hospitalId = req.user.hospitalId || bodyHospitalId;

        if (!hospitalId) {
            return res.status(400).json({ message: 'Hospital context is required to register a patient.' });
        }

        // Use provided password or generate a random one
        const finalPassword = password || (Math.random().toString(36).slice(-8) + 'W1!');

        // Create authentication user account
        const user = await authService.registerUser({
            firstName,
            lastName,
            email,
            mobile,
            profilePicture: file ? file.path : '',
            password: finalPassword,
            role: 'patient',
            hospitalId
        });

        // Create the associated Patient profile
        const patientName = firstName ? `${firstName} ${lastName || ''}`.trim() : 'Unknown';
        const patient = new Patient({
            user: user._id,
            hospitalId,
            name: patientName,
            firstName,
            lastName,
            mobile,
            mobile,
            email,
            password: finalPassword,
            gender,
            dateOfBirth,
            bloodGroup,
            address,
            emergencyContact,
            symptoms,
            registrationMethod: 'manual'
        });

        await patient.save();

        res.status(201).json({
            message: 'Patient profile created manually successfully',
            user: {
                _id: user._id,
                email: user.email,
                mobile: user.mobile,
                role: user.role
            },
            patient,
            tempPassword: password ? undefined : finalPassword
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update Patient Profile by ID (Admin/Doctor)
const updateProfileById = async (req, res) => {
    const { name, firstName, lastName, email, mobile, gender, dateOfBirth, bloodGroup, address, emergencyContact, symptoms } = req.body;
    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        // Update Auth model if email or mobile are provided
        if (email !== undefined || mobile !== undefined) {
            const authUser = await Auth.findById(patient.user);
            if (authUser) {
                // Check if new email/mobile is already in use by someone else
                const query = { _id: { $ne: authUser._id }, $or: [] };
                if (email !== undefined) query.$or.push({ email });
                if (mobile !== undefined) query.$or.push({ mobile });
                
                if (query.$or.length > 0) {
                    const existingUser = await Auth.findOne(query);
                    if (existingUser) {
                        return res.status(400).json({ message: 'Email or mobile number is already in use by another user' });
                    }
                }

                if (email !== undefined) {
                    authUser.email = email;
                    patient.email = email; // Also update email in Patient schema
                }
                if (mobile !== undefined) {
                    authUser.mobile = mobile;
                    patient.mobile = mobile; // Also update mobile in Patient schema
                }
                await authUser.save();
            }
        }

        if (name !== undefined) patient.name = name;
        if (firstName !== undefined) patient.firstName = firstName;
        if (lastName !== undefined) patient.lastName = lastName;
        if (gender !== undefined) patient.gender = gender;
        if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth;
        if (bloodGroup !== undefined) patient.bloodGroup = bloodGroup;
        if (address) patient.address = { ...patient.address, ...address };
        if (emergencyContact) patient.emergencyContact = { ...patient.emergencyContact, ...emergencyContact };
        if (symptoms !== undefined) patient.symptoms = symptoms;

        await patient.save();
        res.status(200).json({ message: 'Patient profile updated successfully by Admin/Doctor', patient });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete Patient (Admin only)
const deletePatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        // Soft delete the patient profile
        patient.isDeleted = true;
        await patient.save();

        // Soft delete the associated Auth account
        const authUser = await Auth.findById(patient.user);
        if (authUser) {
            authUser.isApproved = false;
            authUser.email = `deleted_${Date.now()}_${authUser.email}`;
            authUser.mobile = `deleted_${Date.now()}_${authUser.mobile}`;
            await authUser.save();
        }

        // Automatically discharge if admitted
        const BedAllocation = require('../ward/models/bedAllocation.model');
        const Ward = require('../ward/models/ward.model');
        const allocations = await BedAllocation.find({
            patient: patient._id,
            status: { $in: ['Admitted', 'Discharge Requested'] }
        });

        for (const allocation of allocations) {
            allocation.status = 'Discharged';
            allocation.dischargeDate = new Date();
            await allocation.save();

            const ward = await Ward.findById(allocation.ward);
            if (ward) {
                ward.availableBeds += 1;
                await ward.save();
            }
        }

        res.status(200).json({ message: 'Patient profile soft-deleted and active beds released successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Full Medical Records
const getFullMedicalRecords = async (req, res) => {
    try {
        let patientId = req.params.id;
        const role = req.user.role;

        // If self-access
        if (req.route.path.includes('/me') || !patientId) {
            const patient = await Patient.findOne({ user: req.user.sub });
            if (!patient) return res.status(404).json({ message: 'Patient profile not found' });
            patientId = patient._id;
        }

        // Access control: Only allowed if it's the patient themselves, a doctor, or an admin
        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient profile not found' });

        if (role === 'patient' && patient.user.toString() !== req.user.sub) {
            return res.status(403).json({ message: 'Forbidden: You can only view your own records' });
        }

        // Fetch independent modules data
        const consultations = await Consultation.find({ patient: patientId })
            .populate('doctor', 'name specialization')
            .sort({ createdAt: -1 });

        const digitalPrescriptions = await Prescription.find({ patient: patientId })
            .populate('doctor', 'name')
            .sort({ createdAt: -1 });

        const fullRecords = {
            patientDetails: {
                name: patient.name || `${patient.firstName} ${patient.lastName}`,
                bloodGroup: patient.bloodGroup,
                age: patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : null
            },
            medicalHistory: patient.medicalHistory, // From patient schema
            reports: patient.reports, // From patient schema
            consultations: consultations, // From Consultation module
            prescriptions: digitalPrescriptions // From Prescription module
        };

        res.status(200).json({ message: 'Full medical records fetched successfully', data: fullRecords });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const forgotPassword = async (req, res) => {
    const { mobile } = req.body;
    try {
        const patient = await Patient.findOne({ mobile });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const otpService = require('./otpService');
        const otp = otpService.generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        patient.otp = otp;
        patient.otpExpiry = otpExpiry;
        await patient.save();

        await otpService.sendOTP(mobile, otp);

        res.status(200).json({ 
            message: 'OTP sent successfully to your mobile number', 
            patientId: patient._id 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const resetPassword = async (req, res) => {
    const { patientId, otp, newPassword } = req.body;
    try {
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        if (patient.otp !== otp || patient.otpExpiry < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        patient.password = hashedPassword;
        patient.otp = undefined;
        patient.otpExpiry = undefined;
        await patient.save();

        // Also update the password in the associated Auth account
        const Auth = require('../auth/auth.model');
        const authUser = await Auth.findById(patient.user);
        if (authUser) {
            authUser.password = newPassword;
            await authUser.save();
        }

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    register,
    verifyOtp,
    login,
    getProfile,
    updateProfile,
    getMedicalHistory,
    addMedicalHistory,
    uploadReport,
    getAppointments,
    addAppointment,
    cancelAppointment,
    getPrescriptions,
    addPrescription,
    getAllPatients,
    manualRegister,
    updateProfileById,
    deletePatient,
    getFullMedicalRecords,
    forgotPassword,
    resetPassword
};
