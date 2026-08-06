const LabTest = require('./models/labTest.model');
const LabRequest = require('./models/labRequest.model');
const Auth = require('../auth/auth.model');
const Patient = require('../patient/patient.model');
const Doctor = require('../doctor/doctor.model');
const notificationEmitter = require('../../services/event.service');
const notificationService = require('../notification/notification.service');

// --- Inventory of Tests ---
const addTest = async (hospitalId, data) => {
    const existing = await LabTest.findOne({ testName: data.testName, hospitalId });
    if (existing) {
        throw new Error('A test with this name already exists in this hospital');
    }

    const test = new LabTest({ ...data, hospitalId });
    await test.save();
    return test;
};

const getTests = async (hospitalId, queryParams) => {
    const filter = { hospitalId };
    
    if (queryParams.category) {
        filter.category = queryParams.category;
    }
    if (queryParams.search) {
        filter.testName = { $regex: queryParams.search, $options: 'i' };
    }

    return await LabTest.find(filter).sort({ testName: 1 });
};

const updateTest = async (hospitalId, testId, data) => {
    const test = await LabTest.findOne({ _id: testId, hospitalId });
    if (!test) throw new Error('Test not found');

    Object.assign(test, data);
    await test.save();
    return test;
};

// --- Patient Test Requests ---
const createRequest = async (hospitalId, technicianId, data) => {
    let totalAmount = 0;
    const testItems = [];

    for (const testId of data.tests) {
        const testDetails = await LabTest.findOne({ _id: testId, hospitalId });
        if (!testDetails) {
            throw new Error(`Test with ID ${testId} not found`);
        }
        
        totalAmount += testDetails.price;
        
        testItems.push({
            test: testId,
            price: testDetails.price,
            status: 'Pending'
        });
    }

    const creator = await Auth.findById(technicianId);
    const isLabTech = creator && creator.role === 'lab_technician';

    const request = new LabRequest({
        patient: data.patient,
        doctor: data.doctor,
        tests: testItems,
        totalAmount,
        paymentStatus: data.paymentStatus || 'Unpaid',
        patientType: data.patientType || 'OPD',
        labTechnician: isLabTech ? technicianId : undefined,
        hospitalId
    });

    await request.save();

    // --- NOTIFICATION TRIGGER ---
    try {
        const patientRecord = await Patient.findById(data.patient);
        if (patientRecord && patientRecord.user) {
            notificationEmitter.emit('notification:send', {
                recipient: patientRecord.user,
                title: 'Lab Test Requested',
                message: `A new lab test has been requested for you.`,
                type: 'info',
                relatedData: { labRequestId: request._id }
            });
        }

        const labTechs = await Auth.find({ hospitalId, role: 'lab_technician' });
        labTechs.forEach(tech => {
            notificationEmitter.emit('notification:send', {
                recipient: tech._id,
                title: 'New Lab Request',
                message: `A new lab test request is pending.`,
                type: 'info',
                relatedData: { labRequestId: request._id }
            });
        });
    } catch (notifErr) {
        console.error('Failed to send lab request notifications:', notifErr);
    }

    return request;
};

const getRequests = async (hospitalId, queryParams, userId, role) => {
    const filter = {};

    if (role === 'patient') {
        const user = await Auth.findById(userId);
        const patients = await Patient.find({ user: userId });

        filter.$or = [
            { patient: userId },
            { patientId: userId },
            { userId: userId }
        ];
        if (user && user.mobile) filter.$or.push({ mobile: user.mobile });
        if (patients.length > 0) filter.$or.push({ patient: { $in: patients.map(p => p._id) } });
    } else {
        if (hospitalId) {
            filter.hospitalId = hospitalId;
        }
        if (queryParams.patient) {
            filter.patient = queryParams.patient;
        }
    }
    if (queryParams.overallStatus) {
        filter.overallStatus = queryParams.overallStatus;
    }

    const requests = await LabRequest.find(filter)
        .populate({ path: 'patient', select: 'firstName lastName mobile email' })
        .populate({ path: 'doctor', select: 'firstName lastName' })
        .populate({ path: 'tests.test', select: 'testName category turnaroundTime' })
        .populate({ path: 'labTechnician', select: 'firstName lastName' })
        .sort({ createdAt: -1 })
        .lean();

    return requests.map(req => {
        if (!req.labTechnician) {
            req.labTechnician = { _id: null, firstName: 'Unassigned', lastName: '' };
        }
        if (!req.doctor) {
            req.doctor = { _id: null, firstName: 'Unknown', lastName: '' };
        }
        if (req.tests && Array.isArray(req.tests)) {
            req.tests = req.tests.map(t => {
                const url = t.reportFileUrl || t.reportUrl || t.filePath || '';
                
                let testNameStr = 'Unknown Test';
                let categoryStr = '';
                let turnaroundTimeStr = '';
                
                if (t.test && typeof t.test === 'object') {
                    testNameStr = t.test.testName || 'Unknown Test';
                    categoryStr = t.test.category || '';
                    turnaroundTimeStr = t.test.turnaroundTime || '';
                }

                return {
                    ...t,
                    testName: testNameStr,
                    name: testNameStr, // Fallback for 'name'
                    category: categoryStr,
                    turnaroundTime: turnaroundTimeStr,
                    reportFileUrl: url,
                    reportUrl: url,
                    filePath: url
                };
            });
        }
        return req;
    });
};

const getRequestById = async (hospitalId, requestId, userId, userRole) => {
    const query = { _id: requestId };
    if (userRole !== 'patient' && hospitalId) {
        query.hospitalId = hospitalId;
    }
    const request = await LabRequest.findOne(query)
        .populate({ path: 'patient', select: 'firstName lastName mobile email' })
        .populate({ path: 'doctor', select: 'firstName lastName' })
        .populate({ path: 'tests.test', select: 'testName category turnaroundTime' })
        .populate({ path: 'labTechnician', select: 'firstName lastName' })
        .lean();

    if (!request) {
        throw new Error('Lab request not found');
    }

    if (!request.labTechnician) {
        request.labTechnician = { _id: null, firstName: 'Unassigned', lastName: '' };
    }
    if (!request.doctor) {
        request.doctor = { _id: null, firstName: 'Unknown', lastName: '' };
    }

    if (request.tests && Array.isArray(request.tests)) {
        request.tests = request.tests.map(t => {
            const url = t.reportFileUrl || t.reportUrl || t.filePath || '';
            let testNameStr = 'Unknown Test';
            let categoryStr = '';
            let turnaroundTimeStr = '';
            
            if (t.test && typeof t.test === 'object') {
                testNameStr = t.test.testName || 'Unknown Test';
                categoryStr = t.test.category || '';
                turnaroundTimeStr = t.test.turnaroundTime || '';
            }

            return {
                ...t,
                testName: testNameStr,
                name: testNameStr,
                category: categoryStr,
                turnaroundTime: turnaroundTimeStr,
                reportFileUrl: url,
                reportUrl: url,
                filePath: url
            };
        });
    }

    // Patient can only view their own requests
    if (userRole === 'patient') {
        const patients = await Patient.find({ user: userId });
        const patientIds = patients.map(p => p._id.toString());
        
        const requestPatientId = request.patient ? (request.patient._id ? request.patient._id.toString() : request.patient.toString()) : null;

        if (!patientIds.includes(requestPatientId) && requestPatientId !== userId.toString()) {
            throw new Error('Unauthorized to view this lab request');
        }
    }

    return request;
};

const updateTestStatus = async (hospitalId, requestId, testItemId, data) => {
    const request = await LabRequest.findOne({ _id: requestId, hospitalId });
    if (!request) {
        throw new Error('Lab request not found');
    }

    // --- OPD Gate Check ---
    if (request.patientType === 'OPD' && (data.status === 'Sample Collected' || data.status === 'Completed') && request.paymentStatus !== 'Paid') {
        throw new Error('Payment is pending. Please collect payment before proceeding with the test (Pay As You Go).');
    }

    const testItem = request.tests.id(testItemId);
    if (!testItem) {
        throw new Error('Specific test not found in this request');
    }

    testItem.status = data.status;
    if (data.resultNotes !== undefined) {
        testItem.resultNotes = data.resultNotes;
    }

    await request.save(); // pre-save hook will update overallStatus
    return request;
};

const uploadReport = async (hospitalId, requestId, testItemId, fileUrl) => {
    const request = await LabRequest.findOne({ _id: requestId, hospitalId });
    if (!request) throw new Error('Lab request not found');

    // --- OPD Gate Check ---
    if (request.patientType === 'OPD' && request.paymentStatus !== 'Paid') {
        throw new Error('Payment is pending. Cannot upload report for unpaid tests (Pay As You Go).');
    }

    const testItem = request.tests.id(testItemId);
    if (!testItem) throw new Error('Specific test not found in this request');

    testItem.reportFileUrl = fileUrl;
    testItem.reportUrl = fileUrl;
    testItem.filePath = fileUrl;
    testItem.status = 'Completed'; // Auto-complete if report is uploaded
    
    await request.save();

    // --- NOTIFICATION TRIGGER ---
    try {
        const patientRecord = await Patient.findById(request.patient);
        if (patientRecord && patientRecord.user) {
            notificationEmitter.emit('notification:send', {
                recipient: patientRecord.user,
                title: 'Lab Report Ready',
                message: `Your lab report is ready and has been uploaded.`,
                type: 'success',
                relatedData: { labRequestId: request._id, reportUrl: fileUrl }
            });

            // Send WhatsApp/SMS Notification
            try {
                if (patientRecord.mobile) {
                    const message = `Hello ${patientRecord.firstName || patientRecord.name}, your lab report is ready and has been uploaded to your portal.`;
                    await notificationService.sendMessage(patientRecord.mobile, message, 'whatsapp');
                }
            } catch (smsErr) {
                console.error('Failed to send WhatsApp notification:', smsErr);
            }
        }

        if (request.doctor) {
            const docProfile = await Doctor.findById(request.doctor);
            if (docProfile && docProfile.user) {
                notificationEmitter.emit('notification:send', {
                    recipient: docProfile.user,
                    title: 'Patient Lab Report Uploaded',
                    message: `A lab report for your patient ${patientRecord ? patientRecord.name || patientRecord.firstName : ''} has been uploaded.`,
                    type: 'info',
                    relatedData: { labRequestId: request._id, reportUrl: fileUrl }
                });
            }
        }
    } catch (notifErr) {
        console.error('Failed to send report upload notifications:', notifErr);
    }

    const reqObj = request.toObject();
    if (reqObj.tests) {
        reqObj.tests = reqObj.tests.map(t => {
            const url = t.reportFileUrl || t.reportUrl || t.filePath || '';
            return {
                ...t,
                reportFileUrl: url,
                reportUrl: url,
                filePath: url
            };
        });
    }
    return reqObj;
};

const deleteTest = async (hospitalId, testId) => {
    const test = await LabTest.findOneAndDelete({ _id: testId, hospitalId });
    if (!test) throw new Error('Test not found');
    return test;
};

module.exports = {
    addTest,
    getTests,
    updateTest,
    deleteTest,
    createRequest,
    getRequests,
    getRequestById,
    updateTestStatus,
    uploadReport
};
