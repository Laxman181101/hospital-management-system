const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Prescription = require('./prescription.model');
const Patient = require('../patient/patient.model');
const Doctor = require('../doctor/doctor.model');
const Medicine = require('../pharmacy/models/medicine.model');

// Generate PDF Helper
const generatePrescriptionPDF = async (prescription, doctor, patient) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            
            // Ensure uploads directory exists
            const uploadsDir = path.join(__dirname, '../../../uploads/prescriptions');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const fileName = `prescription_${prescription._id}.pdf`;
            const filePath = path.join(uploadsDir, fileName);
            const writeStream = fs.createWriteStream(filePath);
            
            doc.pipe(writeStream);

            // Header
            doc.fontSize(20).text('HOSPITAL MANAGEMENT SYSTEM', { align: 'center' });
            doc.moveDown();
            doc.moveDown();

            if (prescription.patientType === 'IPD') {
                doc.fontSize(16).fillColor('#4f46e5').text('IPD PROGRESS NOTES / ROUNDS', { align: 'center' }).fillColor('#000000');
                doc.moveDown();
            } else {
                doc.fontSize(16).text('MEDICAL PRESCRIPTION', { align: 'center' });
                doc.moveDown();
            }

            // Doctor Details
            doc.fontSize(12).text(`Dr. ${doctor.name}`);
            doc.text(`Specialization: ${doctor.specialization}`);
            doc.moveDown();

            // Patient Details
            doc.text(`Patient Name: ${patient.name || patient.firstName + ' ' + patient.lastName}`);
            doc.text(`Date: ${prescription.createdAt ? prescription.createdAt.toDateString() : new Date().toDateString()}`);
            doc.moveDown();

            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();

            // Fetch Consultation Details if available
            if (prescription.consultation) {
                const Consultation = require('../consultation/consultation.model');
                const consultationData = await Consultation.findById(prescription.consultation);
                if (consultationData) {
                    doc.fontSize(14).text('Clinical Details:');
                    doc.moveDown(0.5);
                    doc.fontSize(12).text(`Symptoms:`, { continued: true }).font('Helvetica').text(` ${consultationData.symptoms}`);
                    doc.font('Helvetica-Bold').text(`Diagnosis:`, { continued: true }).font('Helvetica').text(` ${consultationData.diagnosis}`);
                    if (consultationData.clinicalNotes) {
                        doc.font('Helvetica-Bold').text(`Notes:`, { continued: true }).font('Helvetica').text(` ${consultationData.clinicalNotes}`);
                    }
                    doc.moveDown();
                    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                    doc.moveDown();
                }
            }
            doc.font('Helvetica-Bold');

            // Medicines
            doc.fontSize(14).text('Medicines Prescribed:');
            doc.moveDown(0.5);
            
            prescription.medicines.forEach((med, index) => {
                doc.fontSize(12).text(`${index + 1}. ${med.name}`);
                doc.fontSize(10).text(`    Dosage: ${med.dosage} | Frequency: ${med.frequency} | Duration: ${med.duration}`);
                if (med.instructions) {
                    doc.text(`    Instructions: ${med.instructions}`);
                }
                doc.moveDown();
            });

            // General Instructions
            if (prescription.generalInstructions) {
                doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                doc.moveDown();
                doc.fontSize(14).text('General Instructions:');
                doc.fontSize(10).text(prescription.generalInstructions);
                doc.moveDown();
            }

            // Footer
            doc.fontSize(10).text('This is a digitally generated prescription.', 50, 700, { align: 'center' });

            doc.end();

            writeStream.on('finish', () => {
                resolve(`/uploads/prescriptions/${fileName}`);
            });

            writeStream.on('error', (err) => {
                reject(err);
            });

        } catch (error) {
            reject(error);
        }
    });
};

const createPrescription = async (doctorId, prescriptionData) => {
    const { patientId, consultationId, medicines, generalInstructions, patientType, allocationId } = prescriptionData;

    const mongoose = require('mongoose');
    let targetPatientId = patientId;

    // If patientId missing, lookup via consultation
    if (!targetPatientId && consultationId && mongoose.isValidObjectId(consultationId)) {
        const Consultation = require('../consultation/consultation.model');
        const cData = await Consultation.findById(consultationId);
        if (cData && cData.patient) {
            targetPatientId = cData.patient;
        }
    }

    let patient = null;
    if (targetPatientId && mongoose.isValidObjectId(targetPatientId)) {
        patient = await Patient.findOne({
            $or: [
                { _id: targetPatientId },
                { user: targetPatientId }
            ]
        });
    }

    if (!patient) {
        patient = await Patient.findOne();
    }
    if (!patient) throw new Error('Patient not found');

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) throw new Error('Doctor not found');

    // Validate medicine stock
    if (medicines && medicines.length > 0) {
        for (const med of medicines) {
            if (!med.isOutsidePharmacy) {
                const stockItem = await Medicine.findOne({ 
                    name: new RegExp(`^${med.name.trim()}$`, 'i'), 
                    stockQuantity: { $gt: 0 } 
                });
                if (!stockItem) {
                    throw new Error(`Medicine '${med.name}' is not available in the stock. Please check 'For Outside Pharmacy' to prescribe it from outside.`);
                }
            }
        }
    }

    let prescription = new Prescription({
        doctor: doctorId,
        patient: patient._id,
        consultation: consultationId,
        patientType: patientType || 'OPD',
        allocation: allocationId,
        medicines,
        generalInstructions
    });

    await prescription.save();

    // Generate PDF
    const pdfUrl = await generatePrescriptionPDF(prescription, doctor, patient);
    prescription.pdfPath = pdfUrl;
    await prescription.save();

    // Backward compatibility: add to patient's embedded prescriptions
    patient.prescriptions.push({
        doctorName: doctor.name,
        date: new Date(),
        medicines: medicines,
        instructions: generalInstructions
    });
    await patient.save();

    // Auto-create PharmacyOrder for in-house medicines so it appears on Pharmacist Dashboard
    try {
        const PharmacyOrder = require('../pharmacy/models/pharmacyOrder.model');
        const inHouseMeds = (medicines || []).filter(m => !m.isOutsidePharmacy && m.name);

        if (inHouseMeds.length > 0 && doctor.hospital) {
            const processedItems = [];
            let totalAmount = 0;

            for (const item of inHouseMeds) {
                let stockItem = await Medicine.findOne({
                    name: new RegExp(`^${item.name.trim()}$`, 'i'),
                    hospitalId: doctor.hospital
                });

                if (!stockItem) {
                    stockItem = await Medicine.findOne({
                        name: new RegExp(`^${item.name.trim()}$`, 'i')
                    });
                }

                if (stockItem) {
                    const unitPrice = stockItem.unitPrice || 10;
                    const quantity = 1;
                    const totalPrice = unitPrice * quantity;
                    totalAmount += totalPrice;

                    processedItems.push({
                        medicine: stockItem._id,
                        quantity,
                        unitPrice,
                        totalPrice
                    });
                }
            }

            if (processedItems.length > 0) {
                const pharmacyOrder = new PharmacyOrder({
                    patient: patient._id,
                    prescription: prescription._id,
                    medicines: processedItems,
                    totalAmount,
                    status: 'Pending',
                    paymentStatus: 'Unpaid',
                    paymentMethod: 'Cash',
                    patientType: patientType || 'OPD',
                    hospitalId: doctor.hospital
                });
                await pharmacyOrder.save();
            }
        }
    } catch (orderErr) {
        console.error('Error auto-creating pharmacy order:', orderErr);
    }

    // --- NOTIFICATION TRIGGER ---
    try {
        const Auth = require('../auth/auth.model');
        const notificationEmitter = require('../../services/event.service');

        // Notify Patient
        if (patient.user) {
            notificationEmitter.emit('notification:send', {
                recipient: patient.user,
                title: 'New Prescription',
                message: `Dr. ${doctor.name} has added a new prescription for you.`,
                type: 'info',
                relatedData: { prescriptionId: prescription._id }
            });
        }

        // Notify Pharmacists in the same hospital
        if (doctor.hospital) {
            const pharmacists = await Auth.find({ 
                hospitalId: doctor.hospital, 
                role: 'pharmacist' 
            });

            pharmacists.forEach(pharm => {
                notificationEmitter.emit('notification:send', {
                    recipient: pharm._id,
                    title: 'New Prescription Order',
                    message: `A new prescription has been generated by Dr. ${doctor.name} for patient ${patient.name || patient.firstName}.`,
                    type: 'info',
                    relatedData: { prescriptionId: prescription._id }
                });
            });
        }
    } catch (notifErr) {
        console.error('Failed to send prescription notifications:', notifErr);
    }

    return prescription;
};

const updatePrescription = async (prescriptionId, doctorId, updateData) => {
    const prescription = await Prescription.findOne({ _id: prescriptionId, doctor: doctorId });
    if (!prescription) throw new Error('Prescription not found or unauthorized');

    if (updateData.medicines) prescription.medicines = updateData.medicines;
    if (updateData.generalInstructions) prescription.generalInstructions = updateData.generalInstructions;

    await prescription.save();

    // Regenerate PDF
    const doctor = await Doctor.findById(doctorId);
    const patient = await Patient.findById(prescription.patient);
    const pdfUrl = await generatePrescriptionPDF(prescription, doctor, patient);
    
    prescription.pdfPath = pdfUrl;
    await prescription.save();

    return prescription;
};

const getPrescriptionById = async (prescriptionId) => {
    const prescription = await Prescription.findById(prescriptionId)
        .populate('doctor', 'name specialization')
        .populate({ path: 'patient', select: 'name firstName lastName user', populate: { path: 'user', select: 'email mobile' } });
    if (!prescription) throw new Error('Prescription not found');
    return prescription;
};

const getPatientPrescriptions = async (patientId) => {
    const prescriptions = await Prescription.find({ patient: patientId })
        .populate('doctor', 'name specialization')
        .sort({ createdAt: -1 });
    return prescriptions;
};

const getIPDPrescriptions = async (allocationId) => {
    const prescriptions = await Prescription.find({ allocation: allocationId, patientType: 'IPD' })
        .populate('doctor', 'name specialization')
        .sort({ createdAt: -1 });
    return prescriptions;
};

const getAllPrescriptions = async (hospitalId) => {
    // Find all doctors in this hospital
    const doctors = await Doctor.find({ hospital: hospitalId }).select('_id');
    const doctorIds = doctors.map(doc => doc._id);

    // Find prescriptions created by these doctors
    const prescriptions = await Prescription.find({ doctor: { $in: doctorIds } })
        .populate('doctor', 'name specialization')
        .populate({ path: 'patient', select: 'name firstName lastName user', populate: { path: 'user', select: 'email mobile' } })
        .sort({ createdAt: -1 });
    return prescriptions;
};

module.exports = {
    createPrescription,
    updatePrescription,
    getPrescriptionById,
    getPatientPrescriptions,
    getAllPrescriptions,
    getIPDPrescriptions
};
