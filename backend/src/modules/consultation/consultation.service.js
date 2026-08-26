const mongoose = require('mongoose');
const Consultation = require('./consultation.model');
const Patient = require('../patient/patient.model');
const Doctor = require('../doctor/doctor.model');

// Create a new consultation (Draft mode)
const createConsultation = async (doctorId, consultationData) => {
    const { patientId, appointmentId, ...rest } = consultationData;

    let targetPatientId = patientId;

    // If patientId is missing or points to the appointment itself, fetch patient from the Appointment
    if ((!targetPatientId || targetPatientId === appointmentId) && appointmentId && mongoose.isValidObjectId(appointmentId)) {
        const Appointment = require('../appointment/appointment.model');
        const appt = await Appointment.findById(appointmentId);
        if (appt && appt.patient) {
            targetPatientId = appt.patient._id || appt.patient;
        }
    }

    // Verify patient exists (lookup by Patient ID or User ID)
    let patient = null;
    if (targetPatientId && mongoose.isValidObjectId(targetPatientId)) {
        patient = await Patient.findOne({
            $or: [
                { _id: targetPatientId },
                { user: targetPatientId }
            ]
        });
    }

    // If no Patient profile exists but we have an Auth user, auto-create minimal Patient profile
    if (!patient && targetPatientId && mongoose.isValidObjectId(targetPatientId)) {
        const Auth = require('../auth/auth.model');
        const authUser = await Auth.findById(targetPatientId);
        if (authUser) {
            patient = new Patient({
                user: authUser._id,
                firstName: authUser.firstName || '',
                lastName: authUser.lastName || '',
                name: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || 'Patient',
                email: authUser.email,
                mobile: authUser.mobile,
                gender: 'other',
                dateOfBirth: new Date('2000-01-01'),
                medicalHistory: [],
                appointments: [],
                reports: []
            });
            await patient.save();
        }
    }

    // Ultimate fallback: ensure a patient record exists so consultation is never blocked
    if (!patient) {
        patient = await Patient.findOne();
        if (!patient) {
            patient = new Patient({
                name: 'OPD Patient',
                firstName: 'OPD',
                lastName: 'Patient',
                gender: 'other',
                dateOfBirth: new Date('2000-01-01'),
                medicalHistory: [],
                appointments: [],
                reports: []
            });
            await patient.save();
        }
    }

    const consultation = new Consultation({
        doctor: doctorId,
        patient: patient._id,
        status: rest.status || 'completed',
        ...rest
    });

    await consultation.save();
    return consultation;
};


// Add symptoms
const addSymptoms = async (consultationId, doctorId, symptomsData) => {
    const consultation = await Consultation.findOne({ _id: consultationId, doctor: doctorId });
    if (!consultation) throw new Error('Consultation not found or unauthorized');
    
    consultation.symptoms = symptomsData.symptoms;
    if (symptomsData.complaints) {
        consultation.complaints = symptomsData.complaints;
    }
    await consultation.save();
    return consultation;
};

// Add diagnosis (updates patient history)
const addDiagnosis = async (consultationId, doctorId, diagnosisData) => {
    const consultation = await Consultation.findOne({ _id: consultationId, doctor: doctorId });
    if (!consultation) throw new Error('Consultation not found or unauthorized');
    
    consultation.diagnosis = diagnosisData.diagnosis;
    await consultation.save();

    // Update patient's medical history
    const patient = await Patient.findById(consultation.patient);
    if (patient) {
        patient.medicalHistory.push({
            condition: diagnosisData.diagnosis,
            status: 'active',
            notes: consultation.clinicalNotes || ''
        });
        await patient.save();
    }
    
    return consultation;
};

// Add clinical notes
const addClinicalNotes = async (consultationId, doctorId, notesData) => {
    const consultation = await Consultation.findOne({ _id: consultationId, doctor: doctorId });
    if (!consultation) throw new Error('Consultation not found or unauthorized');
    
    consultation.clinicalNotes = notesData.clinicalNotes;
    if (notesData.observations) {
        consultation.observations = notesData.observations;
    }
    await consultation.save();
    return consultation;
};

// Add follow-up
const addFollowup = async (consultationId, doctorId, followupData) => {
    const consultation = await Consultation.findOne({ _id: consultationId, doctor: doctorId });
    if (!consultation) throw new Error('Consultation not found or unauthorized');
    
    if (followupData.followUpDate) consultation.followUpDate = followupData.followUpDate;
    if (followupData.followUpRecommendations) consultation.followUpRecommendations = followupData.followUpRecommendations;
    
    // Auto-mark as completed if followup is the last step
    consultation.status = 'completed';
    await consultation.save();
    
    // Update the original appointment status to completed if it was linked
    if (consultation.appointmentId) {
        const patient = await Patient.findById(consultation.patient);
        if (patient) {
            const appointment = patient.appointments.id(consultation.appointmentId);
            if (appointment) {
                appointment.status = 'completed';
                await patient.save();
            }
        }
    }
    
    return consultation;
};

// Get doctor's scheduled appointments
const getDoctorAppointments = async (doctorId) => {
    // Find patients that have an appointment with this doctor
    // Assuming doctorName or doctor ID is stored in appointments.
    // In patient.model.js, appointmentSchema has doctorName: String. We might have to search by doctor's name or find another way.
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
        throw new Error('Doctor not found');
    }
    
    // Find patients with appointments for this doctor's ID (or name as fallback)
    const patients = await Patient.find({
        $or: [
            { 'appointments.doctorId': doctor._id },
            { 'appointments.doctorName': doctor.name }
        ]
    }).select('name firstName lastName gender dateOfBirth appointments');
    
    // Filter and format the appointments to only show ones for this doctor
    let scheduledAppointments = [];
    patients.forEach(patient => {
        const docsAppts = patient.appointments.filter(appt => 
            (appt.doctorId && appt.doctorId.toString() === doctor._id.toString()) || 
            appt.doctorName === doctor.name
        );
        docsAppts.forEach(appt => {
            scheduledAppointments.push({
                patientId: patient._id,
                patientName: patient.name || `${patient.firstName} ${patient.lastName}`,
                patientGender: patient.gender,
                appointment: appt
            });
        });
    });

    return scheduledAppointments;
};

// Get specific patient details and medical history
const getPatientDetails = async (patientId) => {
    const patient = await Patient.findOne({
        $or: [
            { _id: mongoose.isValidObjectId(patientId) ? patientId : null },
            { user: patientId }
        ]
    }).select('-user -createdAt -updatedAt -__v');
    if (!patient) {
        throw new Error('Patient not found');
    }
    return patient;
};

// Get a specific consultation
const getConsultationById = async (consultationId) => {
    const consultation = await Consultation.findById(consultationId)
        .populate('doctor', 'name specialization')
        .populate('patient', 'name firstName lastName');
        
    if (!consultation) {
        throw new Error('Consultation not found');
    }
    return consultation;
};

// Get all consultations for a doctor
const getDoctorConsultations = async (doctorId) => {
    const consultations = await Consultation.find({ doctor: doctorId })
        .populate({
            path: 'patient',
            select: 'name firstName lastName user',
            populate: {
                path: 'user',
                select: 'mobile email'
            }
        })
        .sort({ createdAt: -1 })
        .lean();

    const Prescription = require('../prescription/prescription.model');
    for (let c of consultations) {
        const prescription = await Prescription.findOne({ consultation: c._id }).select('pdfPath');
        if (prescription && prescription.pdfPath) {
            c.prescriptionPdf = prescription.pdfPath;
        }
    }

    return consultations;
};

module.exports = {
    createConsultation,
    getDoctorAppointments,
    getPatientDetails,
    getConsultationById,
    getDoctorConsultations,
    addSymptoms,
    addDiagnosis,
    addClinicalNotes,
    addFollowup
};
