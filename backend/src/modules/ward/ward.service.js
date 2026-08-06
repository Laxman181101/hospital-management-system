const Auth = require('../auth/auth.model');
const notificationEmitter = require('../../services/event.service');
const Ward = require('./models/ward.model');
const BedAllocation = require('./models/bedAllocation.model');
const PatientVitals = require('./models/patientVitals.model');
const AdmissionRequest = require('./models/admissionRequest.model');
const IpdDailyRound = require('./models/ipdDailyRound.model');
const Patient = require('../patient/patient.model');
const Doctor = require('../doctor/doctor.model');
const Surgery = require('../operation-theater/surgery.model');
const billingService = require('../billing/billing.service');
const LabRequest = require('../laboratory/models/labRequest.model');
const PharmacyOrder = require('../pharmacy/models/pharmacyOrder.model');

// --- Admission Requests ---
const createAdmissionRequest = async (hospitalId, doctorId, data) => {
    // Validate patient exists and is not deleted
    let patientRecord = await Patient.findOne({ _id: data.patient, isDeleted: { $ne: true } });
    if (!patientRecord) {
        // Fallback: check if frontend sent the Auth (user) ID instead of Patient ID
        patientRecord = await Patient.findOne({ user: data.patient, isDeleted: { $ne: true } });
    }
    if (!patientRecord) {
        throw new Error('Patient not found or has been deleted');
    }

    // Ensure we use the actual Patient _id from here on
    let patientId = patientRecord._id;
    data.patient = patientRecord._id;
    const existingRequest = await AdmissionRequest.findOne({
        patient: patientId,
        hospitalId,
        status: 'Pending'
    });

    if (existingRequest) {
        throw new Error('A pending admission request already exists for this patient');
    }

    const request = new AdmissionRequest({
        ...data,
        patient: patientId,
        doctor: doctorId,
        hospitalId
    });

    await request.save();

    // --- NOTIFICATION TRIGGER ---
    try {
        const receptionists = await Auth.find({ 
            hospitalId, 
            role: { $in: ['receptionist', 'hospital_admin'] } 
        });

        const isUrgent = data.priority === 'Urgent' || data.priority === 'Emergency';
        const notifType = isUrgent ? 'warning' : 'info';
        const doctor = await Auth.findById(doctorId);
        const docName = doctor ? `${doctor.firstName} ${doctor.lastName}` : 'Doctor';

        receptionists.forEach(rec => {
            notificationEmitter.emit('notification:send', {
                recipient: rec._id,
                title: isUrgent ? 'Urgent Admission Request' : 'New Admission Request',
                message: `Dr. ${docName} has requested ${data.priority} admission for patient ${patientRecord.firstName} ${patientRecord.lastName}. Reason: ${data.reason}`,
                type: notifType,
                relatedData: { admissionRequestId: request._id, priority: data.priority }
            });
        });
    } catch (notifErr) {
        console.error('Failed to send admission notification:', notifErr);
    }

    return request;
};

const getAdmissionRequests = async (hospitalId, queryParams) => {
    const filter = { hospitalId };

    if (queryParams.status) {
        filter.status = queryParams.status;
    }
    if (queryParams.patient) {
        filter.patient = queryParams.patient;
    }
    if (queryParams.priority) {
        filter.priority = queryParams.priority;
    }

    return await AdmissionRequest.find(filter)
        .populate({ 
            path: 'patient', 
            select: 'name firstName lastName user',
            populate: { path: 'user', select: 'firstName lastName mobile email' }
        })
        .populate({ path: 'doctor', select: 'firstName lastName' })
        .sort({ createdAt: -1 });
};

// --- Update Admission Request (cancel / change status) ---
const updateAdmissionRequest = async (hospitalId, requestId, data) => {
    const request = await AdmissionRequest.findOne({ _id: requestId, hospitalId });
    if (!request) {
        throw new Error('Admission request not found');
    }
    if (request.status === 'Admitted') {
        throw new Error('Cannot modify a request that has already been admitted');
    }
    if (data.status) {
        request.status = data.status;
    }
    await request.save();
    return request;
};

// --- Assign Nurse to Admission ---
const assignNurse = async (hospitalId, admissionId, nurseId) => {
    const allocation = await BedAllocation.findOne({ _id: admissionId, hospitalId, status: 'Admitted' });
    if (!allocation) {
        throw new Error('Active admission not found');
    }
    allocation.primaryNurse = nurseId;
    await allocation.save();
    return allocation;
};

// --- Ward Management ---
const createWard = async (hospitalId, data) => {
    const existing = await Ward.findOne({ wardName: data.wardName, hospitalId });
    if (existing) {
        throw new Error('A ward with this name already exists in this hospital');
    }

    const ward = new Ward({
        ...data,
        availableBeds: data.totalBeds,
        hospitalId
    });

    await ward.save();
    return ward;
};

const getWards = async (hospitalId) => {
    return await Ward.find({ hospitalId }).sort({ wardType: 1, wardName: 1 });
};

// --- Patient Admission (Bed Allocation) ---
const admitPatient = async (hospitalId, staffId, data) => {
    const ward = await Ward.findOne({ _id: data.ward, hospitalId });
    if (!ward) {
        throw new Error('Ward not found');
    }

    if (ward.availableBeds <= 0) {
        throw new Error('No available beds in this ward');
    }

    let patientId = data.patient;
    const patientDoc = await Patient.findById(patientId);
    if (!patientDoc) {
        const patientByUser = await Patient.findOne({ user: patientId });
        if (patientByUser) {
            patientId = patientByUser._id.toString();
        } else {
            throw new Error('Patient profile not found');
        }
    }

    // Check if patient is already admitted somewhere
    const existingAdmission = await BedAllocation.findOne({
        patient: patientId,
        hospitalId,
        status: 'Admitted'
    });

    if (existingAdmission) {
        throw new Error('Patient is already admitted to a bed. Please discharge or transfer them first.');
    }

    // Map incoming doctor IDs to schema fields
    const assignedDoctor = data.doctorId || data.doctor || data.doctorInCharge || data.primaryDoctor;

    // Fetch patient to ensure they exist and store name
    let patientRecord = await Patient.findOne({ _id: data.patient, isDeleted: { $ne: true } });
    if (!patientRecord) {
        // Fallback: check if frontend sent the Auth (user) ID
        patientRecord = await Patient.findOne({ user: data.patient, isDeleted: { $ne: true } });
    }
    
    if (!patientRecord) {
        throw new Error('Patient not found or has been deleted');
    }
    
    // Ensure we use the actual Patient _id from here on
    data.patient = patientRecord._id;
    
    const patientName = (patientRecord.name || `${patientRecord.firstName || ''} ${patientRecord.lastName || ''}`).trim() || 'Unknown';

    const allocation = new BedAllocation({
        ...data,
        patient: data.patient,
        patientName,
        doctor: assignedDoctor,
        doctorInCharge: assignedDoctor,
        primaryDoctor: assignedDoctor,
        admissionRequest: data.admissionRequestId || data.admissionRequest,
        hospitalId
    });

    await allocation.save();

    // Collect deposit if provided
    if (data.depositAmount && data.depositAmount > 0) {
        const depositTransaction = await billingService.collectDecentralizedPayment({
            module: 'IPD_Deposit',
            referenceId: allocation._id,
            amount: data.depositAmount,
            patient: data.patient,
            paymentMethod: data.paymentMethod || 'Cash'
        }, staffId, hospitalId);
        
        allocation.depositTransaction = depositTransaction._id;
        await allocation.save();
    }

    if (data.admissionRequestId) {
        await AdmissionRequest.findOneAndUpdate(
            { _id: data.admissionRequestId, hospitalId },
            { status: 'Admitted' }
        );
    }

    // Decrease available beds
    ward.availableBeds -= 1;
    await ward.save();

    return allocation;
};

const getAdmissions = async (hospitalId, queryParams) => {
    const filter = { hospitalId };

    if (queryParams.status) {
        filter.status = queryParams.status;
    }
    if (queryParams.patient) {
        filter.patient = queryParams.patient;
    }
    if (queryParams.ward) {
        filter.ward = queryParams.ward;
    }
    if (queryParams.doctor) {
        filter.doctor = queryParams.doctor;
    }

    return await BedAllocation.find(filter)
        .populate({ 
            path: 'patient', 
            select: 'name firstName lastName patientName user',
            populate: { path: 'user', select: 'firstName lastName mobile email' }
        })
        .populate({ path: 'ward', select: 'wardName wardType' })
        .populate({ path: 'primaryNurse', select: 'firstName lastName' })
        .populate({ path: 'doctor doctorInCharge primaryDoctor', select: 'firstName lastName name specialization' })
        .populate('admissionRequest')
        .sort({ admissionDate: -1 });
};

const dischargePatient = async (hospitalId, staffId, allocationId, body = {}) => {
    const allocation = await BedAllocation.findOne({ 
        _id: allocationId, 
        hospitalId, 
        status: { $in: ['Admitted', 'Discharge Requested'] } 
    }).populate('depositTransaction');
    if (!allocation) {
        throw new Error('Active admission record not found or already discharged');
    }

    const admissionDate = allocation.admissionDate;
    const dischargeDate = new Date();
    
    // Save discharge notes if provided
    if (body.dischargeNotes) {
        allocation.dischargeNotes = body.dischargeNotes;
    }

    // Auto-Generate Draft Bill (skip for internal transfers)
    let draftBill = null;
    let billingError = null;

    if (!body.isTransfer) {
        try {
            const ward = await Ward.findById(allocation.ward);
            let roomCharges = 0;
            let pricePerDay = ward ? ward.pricePerDay : 0;
            let lengthOfStay = Math.ceil((dischargeDate - admissionDate) / (1000 * 60 * 60 * 24));
            if (lengthOfStay < 1) lengthOfStay = 1;
            
            roomCharges = lengthOfStay * pricePerDay;

            const items = [];
            if (ward) {
                items.push({ description: `Room charges (${ward.wardName}) - ${lengthOfStay} days`, amount: pricePerDay, quantity: lengthOfStay });
            } else {
                items.push({ description: `Room charges - manual entry required, ward pricing unavailable`, amount: 0, quantity: 1 });
            }

            // Query related IPD charges
            const labRequests = await LabRequest.find({
                patient: allocation.patient,
                hospitalId: hospitalId,
                patientType: 'IPD',
                paymentStatus: 'Unpaid',
                createdAt: { $gte: admissionDate, $lte: dischargeDate }
            });

            for (const lab of labRequests) {
                items.push({ description: `Lab Request: ${lab._id}`, amount: lab.totalAmount, quantity: 1 });
            }

            const pharmacyOrders = await PharmacyOrder.find({
                patient: allocation.patient,
                hospitalId: hospitalId,
                patientType: 'IPD',
                paymentStatus: 'Unpaid',
                createdAt: { $gte: admissionDate, $lte: dischargeDate }
            });

            for (const pharmacy of pharmacyOrders) {
                items.push({ description: `Pharmacy Order: ${pharmacy._id}`, amount: pharmacy.totalAmount, quantity: 1 });
            }

            // Query IPD Daily Rounds for Doctor Fees
            const dailyRounds = await IpdDailyRound.find({
                allocation: allocation._id,
                hospitalId: hospitalId
            }).populate('doctor', 'firstName lastName');

            const roundsByDoctor = {};
            for (const round of dailyRounds) {
                if (round.doctor) {
                    const docAuthId = round.doctor._id.toString();
                    if (!roundsByDoctor[docAuthId]) {
                        roundsByDoctor[docAuthId] = {
                            name: `${round.doctor.firstName || ''} ${round.doctor.lastName || ''}`.trim(),
                            count: 0
                        };
                    }
                    roundsByDoctor[docAuthId].count += 1;
                }
            }

            for (const docAuthId in roundsByDoctor) {
                const data = roundsByDoctor[docAuthId];
                // Fetch doctor profile to get consultationFee
                const docProfile = await Doctor.findOne({ user: docAuthId });
                const fee = docProfile && docProfile.consultationFee ? docProfile.consultationFee : 500; // Default 500 if missing
                
                items.push({ 
                    description: `Doctor Visit (Dr. ${data.name || 'Doctor'})`, 
                    amount: fee, 
                    quantity: data.count 
                });
            }

            // Query IPD Surgeries
            const surgeries = await Surgery.find({
                admissionId: allocation._id,
                hospitalId: hospitalId,
                status: 'Completed',
                paymentStatus: 'Unpaid'
            }).populate('operationTheaterId', 'name');

            for (const surg of surgeries) {
                const otName = surg.operationTheaterId ? surg.operationTheaterId.name : 'OT';
                if (surg.otRoomCharge > 0) items.push({ description: `Surgery: ${surg.surgeryName} (${otName} Charge)`, amount: surg.otRoomCharge, quantity: 1 });
                if (surg.surgeonFee > 0) items.push({ description: `Surgery: ${surg.surgeryName} (Surgeon Fee)`, amount: surg.surgeonFee, quantity: 1 });
                if (surg.anesthetistFee > 0) items.push({ description: `Surgery: ${surg.surgeryName} (Anesthesia Fee)`, amount: surg.anesthetistFee, quantity: 1 });
                if (surg.consumableCharges > 0) items.push({ description: `Surgery: ${surg.surgeryName} (Consumables)`, amount: surg.consumableCharges, quantity: 1 });
            }

            // Handle Deposit
            if (allocation.depositTransaction && allocation.depositTransaction.amount > 0) {
                items.push({ description: 'Less: Deposit paid', amount: -allocation.depositTransaction.amount, quantity: 1 });
            }

            // Create Billing Document
            draftBill = await billingService.createBilling({
                patient: allocation.patient,
                admission: allocation._id,
                items: items,
                paymentStatus: 'unpaid'
            }, staffId, hospitalId);
            
        } catch (err) {
            console.error('Error generating draft bill on discharge:', err);
            billingError = 'Failed to auto-generate draft bill. You can create it manually.';
        }
    }


    allocation.status = 'Discharged';
    allocation.dischargeDate = dischargeDate;
    await allocation.save();

    // Increase available beds
    const wardToUpdate = await Ward.findById(allocation.ward);
    if (wardToUpdate) {
        wardToUpdate.availableBeds += 1;
        await wardToUpdate.save();
    }

    return { allocation, draftBill, billingError };
};

const requestDischarge = async (hospitalId, allocationId) => {
    const allocation = await BedAllocation.findOne({ _id: allocationId, hospitalId, status: 'Admitted' });
    if (!allocation) {
        throw new Error('Active admission record not found');
    }

    allocation.status = 'Discharge Requested';
    await allocation.save();

    return allocation;
};

// --- Patient Vitals ---
const recordVitals = async (hospitalId, nurseId, data) => {
    // Verify allocation exists and is active
    const allocation = await BedAllocation.findOne({
        _id: data.allocation,
        patient: data.patient,
        hospitalId,
        status: { $in: ['Admitted', 'Discharge Requested'] }
    });

    if (!allocation) {
        throw new Error('Active admission record not found for this patient');
    }

    const vitals = new PatientVitals({
        ...data,
        nurse: nurseId,
        hospitalId
    });

    await vitals.save();
    return vitals;
};

const getVitals = async (hospitalId, allocationId) => {
    return await PatientVitals.find({ allocation: allocationId, hospitalId })
        .populate({ path: 'nurse', select: 'firstName lastName' })
        .sort({ recordedAt: -1 });
};

// --- IPD Daily Rounds ---
const createDailyRound = async (hospitalId, doctorId, allocationId, data) => {
    // Verify the admission exists and is active
    const allocation = await BedAllocation.findOne({
        _id: allocationId,
        hospitalId,
        status: { $in: ['Admitted', 'Discharge Requested'] }
    });

    if (!allocation) {
        throw new Error('Active admission not found for this patient');
    }

    // Create the daily round document
    const round = new IpdDailyRound({
        allocation: allocationId,
        patient: allocation.patient,
        doctor: doctorId,
        roundDate: data.roundDate || new Date(),
        roundType: data.roundType || 'Morning',
        chiefComplaints: data.chiefComplaints,
        clinicalNotes: data.clinicalNotes,
        diagnosis: data.diagnosis,
        medications: data.medications || [],
        labOrdersRequested: data.labOrdersRequested || [],
        followUpPlan: data.followUpPlan,
        hospitalId
    });

    // Medications are stored in the round document itself.
    // Pharmacy staff will process them from the round details.
    // (Existing PharmacyOrder model requires a medicine ObjectId reference,
    //  so we don't auto-create an order for free-text IPD prescriptions.)

    await round.save();
    return round.populate([
        { path: 'doctor', select: 'firstName lastName' },
        { path: 'patient', select: 'firstName lastName name' }
    ]);
};

const getDailyRounds = async (hospitalId, allocationId) => {
    return await IpdDailyRound.find({ allocation: allocationId, hospitalId })
        .populate({ path: 'doctor', select: 'firstName lastName' })
        .sort({ roundDate: -1 });
};

const getDailyRoundById = async (hospitalId, roundId) => {
    const round = await IpdDailyRound.findOne({ _id: roundId, hospitalId })
        .populate({ path: 'doctor', select: 'firstName lastName' })
        .populate({ path: 'patient', select: 'firstName lastName name' });
    if (!round) throw new Error('Daily round not found');
    return round;
};

// --- IPD Rounds for Pharmacist ---
const getIpdRoundsForPharmacist = async (hospitalId, queryParams) => {
    const filter = {
        hospitalId,
        'medications.0': { $exists: true } // Only rounds that have at least one medication
    };

    // Filter by dispensed status
    if (queryParams.dispensed === 'true') {
        filter.medicationsDispensed = true;
    } else if (queryParams.dispensed === 'false') {
        filter.medicationsDispensed = false;
    }

    return await IpdDailyRound.find(filter)
        .populate({ path: 'doctor', select: 'firstName lastName' })
        .populate({
            path: 'patient',
            select: 'firstName lastName name',
            populate: { path: 'user', select: 'firstName lastName' }
        })
        .populate({
            path: 'allocation',
            select: 'ward bedNumber',
            populate: { path: 'ward', select: 'wardName wardType' }
        })
        .populate({ path: 'dispensedBy', select: 'firstName lastName' })
        .sort({ roundDate: -1 });
};

const markMedicationsDispensed = async (hospitalId, pharmacistId, roundId) => {
    const round = await IpdDailyRound.findOne({ _id: roundId, hospitalId });
    if (!round) throw new Error('IPD round not found');
    if (round.medications.length === 0) throw new Error('This round has no medications to dispense');

    round.medicationsDispensed = true;
    round.dispensedAt = new Date();
    round.dispensedBy = pharmacistId;
    await round.save();

    return round.populate([
        { path: 'doctor', select: 'firstName lastName' },
        { path: 'dispensedBy', select: 'firstName lastName' }
    ]);
};

module.exports = {
    createWard,
    getWards,
    createAdmissionRequest,
    getAdmissionRequests,
    updateAdmissionRequest,
    admitPatient,
    getAdmissions,
    dischargePatient,
    requestDischarge,
    assignNurse,
    recordVitals,
    getVitals,
    createDailyRound,
    getDailyRounds,
    getDailyRoundById,
    getIpdRoundsForPharmacist,
    markMedicationsDispensed
};

