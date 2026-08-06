const labService = require('./laboratory.service');
const validation = require('./laboratory.validation');

// --- Inventory of Tests ---
const addTest = async (req, res, next) => {
    try {
        const { error } = validation.createTest.body.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const test = await labService.addTest(req.user.hospitalId, req.body);
        res.status(201).json({ success: true, message: 'Lab test added successfully', data: test });
    } catch (error) {
        next(error);
    }
};

const getTests = async (req, res, next) => {
    try {
        // Allow patient/super_admin to query specific hospital
        const hospitalId = req.user.hospitalId || req.query.hospitalId;
        if (!hospitalId) return res.status(400).json({ success: false, message: 'Hospital ID is required' });

        const tests = await labService.getTests(hospitalId, req.query);
        res.status(200).json({ success: true, data: tests });
    } catch (error) {
        next(error);
    }
};

const updateTest = async (req, res, next) => {
    try {
        const { error: paramsErr } = validation.updateTest.params.validate(req.params);
        if (paramsErr) return res.status(400).json({ success: false, message: paramsErr.details[0].message });

        const { error: bodyErr } = validation.updateTest.body.validate(req.body);
        if (bodyErr) return res.status(400).json({ success: false, message: bodyErr.details[0].message });

        const test = await labService.updateTest(req.user.hospitalId, req.params.testId, req.body);
        res.status(200).json({ success: true, message: 'Lab test updated', data: test });
    } catch (error) {
        next(error);
    }
};

// --- Patient Test Requests ---
const createRequest = async (req, res, next) => {
    try {
        const { error } = validation.createRequest.body.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const request = await labService.createRequest(req.user.hospitalId, req.user.sub, req.body);
        res.status(201).json({ success: true, message: 'Lab request created successfully', data: request });
    } catch (error) {
        next(error);
    }
};

const getRequests = async (req, res, next) => {
    try {
        const hospitalId = req.user.hospitalId;
        const requests = await labService.getRequests(hospitalId, req.query, req.user.sub, req.user.role);
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        next(error);
    }
};

const getRequestById = async (req, res, next) => {
    try {
        const request = await labService.getRequestById(
            req.user.hospitalId || req.query.hospitalId, 
            req.params.requestId, 
            req.user.sub, 
            req.user.role
        );
        res.status(200).json({ success: true, data: request });
    } catch (error) {
        next(error);
    }
};

const updateTestStatus = async (req, res, next) => {
    try {
        const { error: paramsErr } = validation.updateTestStatus.params.validate(req.params);
        if (paramsErr) return res.status(400).json({ success: false, message: paramsErr.details[0].message });

        const { error: bodyErr } = validation.updateTestStatus.body.validate(req.body);
        if (bodyErr) return res.status(400).json({ success: false, message: bodyErr.details[0].message });

        const request = await labService.updateTestStatus(req.user.hospitalId, req.params.requestId, req.params.testItemId, req.body);
        res.status(200).json({ success: true, message: 'Test status updated', data: request });
    } catch (error) {
        next(error);
    }
};

const uploadReport = async (req, res, next) => {
    try {
        const file = req.file || (req.files && req.files[0]);
        if (!file) {
            return res.status(400).json({ success: false, message: 'Please upload a report file (PDF/Image)' });
        }

        // Use Cloudinary URL if available, otherwise fall back to local upload relative path
        const fileUrl = file.path && file.path.startsWith('http') ? file.path : `/uploads/${file.filename}`;
        
        const request = await labService.uploadReport(req.user.hospitalId, req.params.requestId, req.params.testItemId, fileUrl);
        res.status(200).json({ success: true, message: 'Report uploaded successfully', data: request });
    } catch (error) {
        next(error);
    }
};

const deleteTest = async (req, res, next) => {
    try {
        const test = await labService.deleteTest(req.user.hospitalId, req.params.testId);
        res.status(200).json({ success: true, message: 'Lab test deleted successfully', data: test });
    } catch (error) {
        next(error);
    }
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
