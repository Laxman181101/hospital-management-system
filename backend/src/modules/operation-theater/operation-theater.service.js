const OperationTheater = require('./operationTheater.model');
const Surgery = require('./surgery.model');
const Auth = require('../auth/auth.model');
const Patient = require('../patient/patient.model');

class OperationTheaterService {
    // ---- OT Room Management ----

    async createOT(hospitalId, otData) {
        const ot = new OperationTheater({
            ...otData,
            hospitalId
        });
        return await ot.save();
    }

    async getOTs(hospitalId, query = {}) {
        const filter = { hospitalId, ...query };
        return await OperationTheater.find(filter).sort({ createdAt: -1 });
    }

    async getOTById(hospitalId, otId) {
        return await OperationTheater.findOne({ _id: otId, hospitalId });
    }

    async updateOT(hospitalId, otId, updateData) {
        return await OperationTheater.findOneAndUpdate(
            { _id: otId, hospitalId },
            { $set: updateData },
            { new: true }
        );
    }

    async deleteOT(hospitalId, otId) {
        return await OperationTheater.findOneAndDelete({ _id: otId, hospitalId });
    }


    // ---- Surgery Scheduling & Management ----

    async scheduleSurgery(hospitalId, surgeryData, userId) {
        // Validate OT is not under maintenance
        const ot = await OperationTheater.findOne({ _id: surgeryData.operationTheaterId, hospitalId });
        if (!ot) {
            throw new Error('Operation Theater not found');
        }
        if (ot.status === 'Maintenance') {
            throw new Error('Cannot schedule surgery in an OT that is under maintenance');
        }

        const surgery = new Surgery({
            ...surgeryData,
            hospitalId,
            status: 'Scheduled',
            statusHistory: [{
                status: 'Scheduled',
                changedBy: userId
            }]
        });

        return await surgery.save();
    }

    async requestSurgery(hospitalId, surgeryData, userId) {
        const surgery = new Surgery({
            ...surgeryData,
            hospitalId,
            status: 'Requested',
            statusHistory: [{
                status: 'Requested',
                changedBy: userId
            }]
        });

        return await surgery.save();
    }

    async approveSurgery(hospitalId, surgeryId, approvalData, userId) {
        const surgery = await Surgery.findOne({ _id: surgeryId, hospitalId });
        if (!surgery) throw new Error('Surgery not found');
        if (surgery.status !== 'Requested') throw new Error('Only requested surgeries can be approved');

        const ot = await OperationTheater.findOne({ _id: approvalData.operationTheaterId, hospitalId });
        if (!ot) throw new Error('Operation Theater not found');
        if (ot.status === 'Maintenance') throw new Error('Cannot schedule surgery in an OT that is under maintenance');

        surgery.operationTheaterId = approvalData.operationTheaterId;
        if (approvalData.anesthetistId) surgery.anesthetistId = approvalData.anesthetistId;
        surgery.scheduledDate = approvalData.scheduledDate;
        surgery.startTime = approvalData.startTime;
        surgery.endTime = approvalData.endTime;
        surgery.status = 'Scheduled';

        surgery.statusHistory.push({
            status: 'Scheduled',
            changedBy: userId
        });

        return await surgery.save();
    }

    async getSurgeries(hospitalId, query = {}) {
        const filter = { hospitalId, ...query };
        const surgeries = await Surgery.find(filter)
            .populate('operationTheaterId', 'name type')
            .populate({ path: 'surgeonId', model: 'Auth', select: 'firstName lastName email' })
            .populate({ path: 'anesthetistId', model: 'Auth', select: 'firstName lastName email' })
            .sort({ scheduledDate: 1, startTime: 1 })
            .lean();

        for (let surgery of surgeries) {
            if (surgery.patientId) {
                let p = await Patient.findById(surgery.patientId).select('firstName lastName name uhid').lean();
                if (p) {
                    surgery.patientId = p;
                } else {
                    let a = await Auth.findById(surgery.patientId).select('firstName lastName email').lean();
                    if (a) {
                        surgery.patientId = a;
                    }
                }
            }
        }
        return surgeries;
    }

    async getSurgeryById(hospitalId, surgeryId) {
        let surgery = await Surgery.findOne({ _id: surgeryId, hospitalId })
            .populate('operationTheaterId', 'name type')
            .populate({ path: 'surgeonId', model: 'Auth', select: 'firstName lastName email' })
            .populate({ path: 'anesthetistId', model: 'Auth', select: 'firstName lastName email' })
            .populate('statusHistory.changedBy', 'firstName lastName')
            .lean();
            
        if (surgery && surgery.patientId) {
            let p = await Patient.findById(surgery.patientId).select('firstName lastName name uhid').lean();
            if (p) {
                surgery.patientId = p;
            } else {
                let a = await Auth.findById(surgery.patientId).select('firstName lastName email').lean();
                if (a) {
                    surgery.patientId = a;
                }
            }
        }
        return surgery;
    }

    async updateSurgeryStatus(hospitalId, surgeryId, updateData, userId) {
        const surgery = await Surgery.findOne({ _id: surgeryId, hospitalId });
        if (!surgery) {
            throw new Error('Surgery not found');
        }

        surgery.status = updateData.status;
        if (updateData.postOpNotes) {
            surgery.postOpNotes = updateData.postOpNotes;
        }

        // Apply billing fields if surgery is completed
        if (updateData.status === 'Completed') {
            if (updateData.otRoomCharge !== undefined) surgery.otRoomCharge = updateData.otRoomCharge;
            if (updateData.surgeonFee !== undefined) surgery.surgeonFee = updateData.surgeonFee;
            if (updateData.anesthetistFee !== undefined) surgery.anesthetistFee = updateData.anesthetistFee;
            if (updateData.consumableCharges !== undefined) surgery.consumableCharges = updateData.consumableCharges;
        }

        surgery.statusHistory.push({
            status: updateData.status,
            changedBy: userId
        });

        // Automatically update OT status based on surgery status
        if (updateData.status === 'In-Progress') {
            await OperationTheater.findByIdAndUpdate(surgery.operationTheaterId, { status: 'Occupied' });
        } else if (['Completed', 'Cancelled'].includes(updateData.status)) {
            // Only set back to available if it's currently occupied by this surgery (simplistic handling for now)
            await OperationTheater.findByIdAndUpdate(surgery.operationTheaterId, { status: 'Cleaning' });
        }

        return await surgery.save();
    }

    async rescheduleSurgery(hospitalId, surgeryId, updateData, userId) {
        const surgery = await Surgery.findOne({ _id: surgeryId, hospitalId });
        if (!surgery) {
            throw new Error('Surgery not found');
        }

        if (updateData.operationTheaterId) {
            const ot = await OperationTheater.findOne({ _id: updateData.operationTheaterId, hospitalId });
            if (!ot) {
                throw new Error('Operation Theater not found');
            }
            if (ot.status === 'Maintenance') {
                throw new Error('Cannot schedule surgery in an OT that is under maintenance');
            }
            surgery.operationTheaterId = updateData.operationTheaterId;
        }

        surgery.scheduledDate = updateData.scheduledDate;
        surgery.startTime = updateData.startTime;
        surgery.endTime = updateData.endTime;

        surgery.statusHistory.push({
            status: 'Rescheduled',
            changedBy: userId
        });

        return await surgery.save();
    }
}

module.exports = new OperationTheaterService();
