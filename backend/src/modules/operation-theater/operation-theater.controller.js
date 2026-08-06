const otService = require('./operation-theater.service');
const { 
    createOTSchema, 
    updateOTSchema, 
    scheduleSurgerySchema, 
    requestSurgerySchema,
    approveSurgerySchema,
    updateSurgeryStatusSchema,
    rescheduleSurgerySchema
} = require('./operation-theater.validation');

class OperationTheaterController {
    
    // ---- OT Rooms ----

    createOT = async (req, res, next) => {
        try {
            const { error, value } = createOTSchema.validate(req.body);
            if (error) {
                return res.status(400).json({ success: false, message: error.details[0].message });
            }

            const ot = await otService.createOT(req.user.hospitalId, value);
            return res.status(201).json({ success: true, message: 'Operation Theater created successfully', data: ot });
        } catch (error) {
            next(error);
        }
    };

    getOTs = async (req, res, next) => {
        try {
            const query = req.query; // could contain status or type filters
            const ots = await otService.getOTs(req.user.hospitalId, query);
            return res.status(200).json({ success: true, message: 'Operation Theaters fetched successfully', data: ots });
        } catch (error) {
            next(error);
        }
    };

    getOTById = async (req, res, next) => {
        try {
            const ot = await otService.getOTById(req.user.hospitalId, req.params.id);
            if (!ot) return res.status(404).json({ success: false, message: 'Operation Theater not found' });
            return res.status(200).json({ success: true, message: 'Operation Theater fetched successfully', data: ot });
        } catch (error) {
            next(error);
        }
    };

    updateOT = async (req, res, next) => {
        try {
            const { error, value } = updateOTSchema.validate(req.body);
            if (error) {
                return res.status(400).json({ success: false, message: error.details[0].message });
            }

            const ot = await otService.updateOT(req.user.hospitalId, req.params.id, value);
            if (!ot) return res.status(404).json({ success: false, message: 'Operation Theater not found' });
            return res.status(200).json({ success: true, message: 'Operation Theater updated successfully', data: ot });
        } catch (error) {
            next(error);
        }
    };

    deleteOT = async (req, res, next) => {
        try {
            const ot = await otService.deleteOT(req.user.hospitalId, req.params.id);
            if (!ot) return res.status(404).json({ success: false, message: 'Operation Theater not found' });
            return res.status(200).json({ success: true, message: 'Operation Theater deleted successfully' });
        } catch (error) {
            next(error);
        }
    };

    // ---- Surgeries ----

    scheduleSurgery = async (req, res, next) => {
        try {
            const { error, value } = scheduleSurgerySchema.validate(req.body);
            if (error) {
                return res.status(400).json({ success: false, message: error.details[0].message });
            }

            const surgery = await otService.scheduleSurgery(req.user.hospitalId, value, req.user._id);
            return res.status(201).json({ success: true, message: 'Surgery scheduled successfully', data: surgery });
        } catch (error) {
            if (error.message.includes('not found') || error.message.includes('maintenance')) {
                return res.status(400).json({ success: false, message: error.message });
            }
            next(error);
        }
    };

    requestSurgery = async (req, res, next) => {
        try {
            if (req.user && req.user.role === 'doctor' && !req.body.surgeonId) {
                const Doctor = require('../doctor/doctor.model');
                const doctorProfile = await Doctor.findOne({ user: req.user._id });
                if (doctorProfile) {
                    req.body.surgeonId = doctorProfile._id.toString();
                } else {
                    req.body.surgeonId = req.user._id.toString();
                }
            }
            
            const { error, value } = requestSurgerySchema.validate(req.body);
            if (error) {
                return res.status(400).json({ success: false, message: error.details[0].message });
            }

            const surgery = await otService.requestSurgery(req.user.hospitalId, value, req.user._id);
            return res.status(201).json({ success: true, message: 'Surgery requested successfully', data: surgery });
        } catch (error) {
            next(error);
        }
    };

    approveSurgery = async (req, res, next) => {
        try {
            const { error, value } = approveSurgerySchema.validate(req.body);
            if (error) {
                return res.status(400).json({ success: false, message: error.details[0].message });
            }

            const surgery = await otService.approveSurgery(req.user.hospitalId, req.params.id, value, req.user._id);
            return res.status(200).json({ success: true, message: 'Surgery approved and scheduled successfully', data: surgery });
        } catch (error) {
            if (error.message.includes('not found') || error.message.includes('maintenance') || error.message.includes('Only requested')) {
                return res.status(400).json({ success: false, message: error.message });
            }
            next(error);
        }
    };

    getSurgeries = async (req, res, next) => {
        try {
            const query = req.query; // date filters, status filters, etc.
            const surgeries = await otService.getSurgeries(req.user.hospitalId, query);
            return res.status(200).json({ success: true, message: 'Surgeries fetched successfully', data: surgeries });
        } catch (error) {
            next(error);
        }
    };

    getSurgeryById = async (req, res, next) => {
        try {
            const surgery = await otService.getSurgeryById(req.user.hospitalId, req.params.id);
            if (!surgery) return res.status(404).json({ success: false, message: 'Surgery not found' });
            return res.status(200).json({ success: true, message: 'Surgery fetched successfully', data: surgery });
        } catch (error) {
            next(error);
        }
    };

    updateSurgeryStatus = async (req, res, next) => {
        try {
            const { error, value } = updateSurgeryStatusSchema.validate(req.body);
            if (error) {
                return res.status(400).json({ success: false, message: error.details[0].message });
            }

            const surgery = await otService.updateSurgeryStatus(
                req.user.hospitalId, 
                req.params.id, 
                value, 
                req.user._id
            );
            return res.status(200).json({ success: true, message: 'Surgery status updated successfully', data: surgery });
        } catch (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({ success: false, message: error.message });
            }
            next(error);
        }
    };

    rescheduleSurgery = async (req, res, next) => {
        try {
            const { error, value } = rescheduleSurgerySchema.validate(req.body);
            if (error) {
                return res.status(400).json({ success: false, message: error.details[0].message });
            }

            const surgery = await otService.rescheduleSurgery(
                req.user.hospitalId, 
                req.params.id, 
                value, 
                req.user._id
            );
            return res.status(200).json({ success: true, message: 'Surgery rescheduled successfully', data: surgery });
        } catch (error) {
            if (error.message.includes('not found') || error.message.includes('maintenance')) {
                return res.status(400).json({ success: false, message: error.message });
            }
            next(error);
        }
    };
}

module.exports = new OperationTheaterController();
