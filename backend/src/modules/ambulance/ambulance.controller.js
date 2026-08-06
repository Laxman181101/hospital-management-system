const Ambulance = require('./ambulance.model');
const AmbulanceDispatch = require('./ambulanceDispatch.model');
const { AppError } = require('../../middleware/error.middleware');

// @desc    Add a new ambulance
// @route   POST /api/v1/ambulances
// @access  Private/Admin
exports.addAmbulance = async (req, res, next) => {
    try {
        const { vehicleNumber, type, driverName, driverPhone } = req.body;
        
        // Check if ambulance already exists
        const existingAmbulance = await Ambulance.findOne({ vehicleNumber });
        if (existingAmbulance) {
            return res.status(400).json({
                success: false,
                message: 'Ambulance with this vehicle number already exists'
            });
        }

        const ambulance = await Ambulance.create({
            vehicleNumber,
            type,
            driverName,
            driverPhone
        });

        res.status(201).json({
            success: true,
            message: 'Ambulance added successfully',
            data: ambulance
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all ambulances with their active dispatch details
// @route   GET /api/v1/ambulances
// @access  Private/Receptionist/Admin
exports.getAllAmbulances = async (req, res, next) => {
    try {
        const ambulances = await Ambulance.find().populate('currentDispatch');

        res.status(200).json({
            success: true,
            count: ambulances.length,
            data: ambulances
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all available ambulances
// @route   GET /api/v1/ambulances/available
// @access  Private/Receptionist/Admin
exports.getAvailableAmbulances = async (req, res, next) => {
    try {
        const ambulances = await Ambulance.find({ status: 'Available' });

        res.status(200).json({
            success: true,
            count: ambulances.length,
            data: ambulances
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Dispatch an ambulance for an emergency
// @route   POST /api/v1/ambulances/:id/dispatch
// @access  Private/Receptionist/Admin
exports.dispatchAmbulance = async (req, res, next) => {
    try {
        const ambulanceId = req.params.id;
        let { location, callerName, callerPhone, patientId, dispatchType, dropLocation } = req.body;

        // Prevent CastError if frontend sends an empty string for optional patientId
        if (patientId === "") {
            patientId = undefined;
        }

        if (!location) {
            return res.status(400).json({
                success: false,
                message: 'Location is required to dispatch ambulance'
            });
        }

        const ambulance = await Ambulance.findById(ambulanceId);

        if (!ambulance) {
            return res.status(404).json({
                success: false,
                message: 'Ambulance not found'
            });
        }

        if (ambulance.status !== 'Available') {
            return res.status(400).json({
                success: false,
                message: 'Ambulance is not available right now'
            });
        }

        // Create a dispatch record
        const dispatch = await AmbulanceDispatch.create({
            ambulanceId,
            location,
            callerName,
            callerPhone,
            patientId,
            dispatchType,
            dropLocation
        });

        // Update ambulance status and currentDispatch
        ambulance.status = 'On-Duty';
        ambulance.currentDispatch = dispatch._id;
        await ambulance.save();

        // Optional: Trigger notification to Driver app/SMS here...

        res.status(200).json({
            success: true,
            message: 'Ambulance dispatched successfully',
            data: dispatch
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark ambulance as returned
// @route   POST /api/v1/ambulances/dispatch/:dispatchId/return
// @access  Private/Receptionist/Admin
exports.markAmbulanceReturned = async (req, res, next) => {
    try {
        const { dispatchId } = req.params;

        const dispatch = await AmbulanceDispatch.findById(dispatchId);

        if (!dispatch) {
            return res.status(404).json({
                success: false,
                message: 'Dispatch record not found'
            });
        }

        if (dispatch.status === 'Returned') {
            return res.status(400).json({
                success: false,
                message: 'This dispatch is already marked as returned'
            });
        }

        // Update dispatch record
        dispatch.status = 'Returned';
        dispatch.returnTime = Date.now();
        await dispatch.save();

        // Update ambulance status back to Available
        const ambulance = await Ambulance.findById(dispatch.ambulanceId);
        if (ambulance) {
            ambulance.status = 'Available';
            await ambulance.save();
        }

        res.status(200).json({
            success: true,
            message: 'Ambulance marked as returned successfully',
            data: dispatch
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update ambulance details (like changing driver)
// @route   PUT /api/v1/ambulances/:id
// @access  Private/Admin
exports.updateAmbulance = async (req, res, next) => {
    try {
        const ambulanceId = req.params.id;
        const { driverName, driverPhone, type, status } = req.body;

        const ambulance = await Ambulance.findById(ambulanceId);

        if (!ambulance) {
            return res.status(404).json({
                success: false,
                message: 'Ambulance not found'
            });
        }

        // Handle Return workflow when status is set back to Available
        if (status === 'Available' && ambulance.currentDispatch) {
            const dispatch = await AmbulanceDispatch.findById(ambulance.currentDispatch);
            if (dispatch) {
                dispatch.status = 'Returned';
                dispatch.returnTime = Date.now();
                await dispatch.save();
            }
            ambulance.currentDispatch = null;
        }

        // Update fields if provided
        if (driverName) ambulance.driverName = driverName;
        if (driverPhone) ambulance.driverPhone = driverPhone;
        if (type) ambulance.type = type;
        if (status) ambulance.status = status;

        await ambulance.save();

        res.status(200).json({
            success: true,
            message: 'Ambulance updated successfully',
            data: ambulance
        });
    } catch (error) {
        next(error);
    }
};
