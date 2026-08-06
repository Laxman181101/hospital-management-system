const Billing = require('./billing.model');
const Appointment = require('../appointment/appointment.model');
const PharmacyOrder = require('../pharmacy/models/pharmacyOrder.model');
const LabRequest = require('../laboratory/models/labRequest.model');
const Transaction = require('./transaction.model');
const PDFDocument = require('pdfkit');

const createBilling = async (data, billingAdminId, hospitalId) => {
    // 1. Calculate amounts
    let totalAmount = 0;
    data.items.forEach(item => {
        const qty = item.quantity || 1;
        totalAmount += item.amount * qty;
    });

    const discount = data.discount || 0;
    const tax = data.tax || 0;
    let payableAmount = totalAmount - discount + tax;
    if (payableAmount < 0) payableAmount = 0;

    // 2. Generate unique invoice number
    const uniqueId = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${Date.now()}-${uniqueId}`;

    // 3. Create document
    const billing = new Billing({
        ...data,
        invoiceNumber,
        totalAmount,
        payableAmount,
        hospital: hospitalId,
        billingAdmin: billingAdminId
    });

    await billing.save();

    // 4. If billing is paid and linked to an appointment, update appointment status
    if (data.paymentStatus === 'paid' && data.appointment) {
        await Appointment.findByIdAndUpdate(data.appointment, { paymentStatus: 'paid' });
    }

    if (data.paymentStatus === 'paid' && data.prescription) {
        await PharmacyOrder.findOneAndUpdate({ prescription: data.prescription }, { paymentStatus: 'Paid' });
    }

    return billing;
};

const getBills = async (userId, role, hospitalId, queryParams) => {
    const filter = {};

    // Scoping check
    if (role === 'patient') {
        const Auth = require('../auth/auth.model');
        const Patient = require('../patient/patient.model');
        const user = await Auth.findById(userId);
        const patients = await Patient.find({ user: userId });

        filter.$or = [
            { patient: userId },
            { patientId: userId },
            { userId: userId }
        ];
        if (user && user.mobile) filter.$or.push({ mobile: user.mobile });
        if (patients.length > 0) filter.$or.push({ patient: { $in: patients.map(p => p._id) } });
    } else if (role === 'super_admin') {
        // Super Admin is platform-wide and can view all bills, or filter by a specific hospital
        if (queryParams.hospitalId) {
            filter.hospital = queryParams.hospitalId;
        }
    } else {
        // Staff/Admin - only fetch for their hospital
        filter.hospital = hospitalId;
    }

    if (queryParams.paymentStatus) {
        filter.paymentStatus = queryParams.paymentStatus;
    }
    if (queryParams.patientId) {
        filter.patient = queryParams.patientId;
    }

    return await Billing.find(filter)
        .populate({ path: 'patient', select: 'firstName lastName user', populate: { path: 'user', select: 'email mobile' } })
        .populate({ path: 'billingAdmin', select: 'firstName lastName' })
        .sort({ createdAt: -1 });
};

const getBillById = async (billId, userId, role, hospitalId) => {
    if (!require('mongoose').Types.ObjectId.isValid(billId)) {
        throw new Error('Invalid Billing ID format');
    }
    const bill = await Billing.findById(billId)
        .populate({ path: 'patient', select: 'firstName lastName user', populate: { path: 'user', select: 'email mobile' } })
        .populate({ path: 'hospital', select: 'hospitalName address contactDetails' })
        .populate({ path: 'billingAdmin', select: 'firstName lastName' });

    if (!bill) {
        throw new Error('Billing invoice not found');
    }

    // Scoping checks
    if (role === 'patient') {
        const Patient = require('../patient/patient.model');
        const patients = await Patient.find({ user: userId });
        const patientIds = patients.map(p => p._id.toString());
        
        const billPatientId = bill.patient ? (bill.patient._id ? bill.patient._id.toString() : bill.patient.toString()) : null;

        if (!patientIds.includes(billPatientId) && billPatientId !== userId.toString()) {
            throw new Error('Unauthorized to view this billing invoice');
        }
    } else if (role !== 'super_admin') {
        // Staff/Admin must belong to the same hospital
        if (!hospitalId || !bill.hospital || bill.hospital._id.toString() !== hospitalId.toString()) {
            throw new Error('Unauthorized to view this hospital\'s billing invoice');
        }
    }

    return bill;
};

const updatePayment = async (billId, paymentData, hospitalId) => {
    if (!require('mongoose').Types.ObjectId.isValid(billId)) {
        throw new Error('Invalid Billing ID format');
    }
    const bill = await Billing.findOne({ _id: billId, hospital: hospitalId });
    if (!bill) {
        throw new Error('Billing invoice not found');
    }

    bill.paymentStatus = paymentData.paymentStatus;
    if (paymentData.paymentMethod) {
        bill.paymentMethod = paymentData.paymentMethod;
    }

    if (paymentData.discount !== undefined) {
        bill.discount = Number(paymentData.discount);
        let newPayable = bill.totalAmount - bill.discount + (bill.tax || 0);
        if (newPayable < 0) newPayable = 0;
        bill.payableAmount = newPayable;
    }

    await bill.save();

    // If paid, sync to appointment if present
    if (bill.paymentStatus === 'paid' && bill.appointment) {
        await Appointment.findByIdAndUpdate(bill.appointment, { paymentStatus: 'paid' });
    }

    if (bill.paymentStatus === 'paid' && bill.prescription) {
        await PharmacyOrder.findOneAndUpdate({ prescription: bill.prescription }, { paymentStatus: 'Paid' });
    }

    return bill;
};

const generateInvoicePDF = (bill, res) => {
    const doc = new PDFDocument({ margin: 50 });

    // Stream PDF directly to HTTP response
    doc.pipe(res);

    // Styling colors
    const primaryColor = '#1A365D'; // Navy blue
    const accentColor = '#3182CE';  // Blue
    const lightGray = '#EDF2F7';
    const darkGray = '#4A5568';

    // 1. Hospital Header
    doc.fillColor(primaryColor)
       .fontSize(22)
       .text(bill.hospital?.hospitalName || 'Deleted Hospital', { align: 'left' });
    
    doc.fillColor(darkGray)
       .fontSize(10)
       .text(`${bill.hospital?.address?.street || ''}, ${bill.hospital?.address?.area || ''}`)
       .text(`${bill.hospital?.address?.city || ''}, ${bill.hospital?.address?.state || ''} - ${bill.hospital?.address?.pincode || ''}`)
       .text(`Contact: ${bill.hospital?.contactDetails?.phone || 'N/A'} | Email: ${bill.hospital?.contactDetails?.email || 'N/A'}`)
       .moveDown(1.5);

    // 2. Invoice Details (Meta Block)
    const topY = doc.y;
    doc.fillColor(primaryColor)
       .fontSize(14)
       .text('INVOICE', 50, topY, { bold: true });
    
    doc.fillColor(darkGray)
       .fontSize(9)
       .text(`Invoice No: ${bill.invoiceNumber || 'N/A'}`)
       .text(`Date: ${bill.billingDate ? new Date(bill.billingDate).toLocaleDateString() : new Date().toLocaleDateString()}`)
       .text(`Admin: ${bill.billingAdmin ? `${bill.billingAdmin.firstName || ''} ${bill.billingAdmin.lastName || ''}`.trim() : 'System / Deleted Admin'}`);

    // Patient Details
    doc.fillColor(primaryColor)
       .fontSize(11)
       .text('BILL TO:', 320, topY, { bold: true });
    
    doc.fillColor(darkGray)
       .fontSize(9)
       .text(`Patient Name: ${bill.patient ? `${bill.patient.firstName || ''} ${bill.patient.lastName || ''}`.trim() : 'Deleted Patient'}`, 320)
       .text(`Email: ${bill.patient?.user?.email || bill.patient?.email || 'N/A'}`)
       .text(`Mobile: ${bill.patient?.user?.mobile || bill.patient?.mobile || 'N/A'}`);

    doc.moveDown(2);

    // Divider Line
    doc.strokeColor(primaryColor)
       .lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke();
    
    doc.moveDown(1.5);

    // 3. Billing Table Header
    const tableHeaderY = doc.y;
    doc.rect(50, tableHeaderY, 500, 20).fill(primaryColor);
    doc.fillColor('#FFFFFF')
       .fontSize(9)
       .text('Description', 60, tableHeaderY + 6)
       .text('Amount', 320, tableHeaderY + 6, { width: 60, align: 'right' })
       .text('Qty', 410, tableHeaderY + 6, { width: 30, align: 'center' })
       .text('Total', 470, tableHeaderY + 6, { width: 70, align: 'right' });

    doc.moveDown(1.5);

    // 4. Table Body (Line Items)
    doc.fillColor(darkGray);
    let currentY = doc.y + 10;
    
    const items = bill.items || [];
    items.forEach(item => {
        // If Y is nearing page bottom, create a new page and redraw table headers
        if (currentY > 700) {
            doc.addPage();
            currentY = 50; // top margin of new page
            
            // Draw Table Header on new page
            doc.rect(50, currentY, 500, 20).fill(primaryColor);
            doc.fillColor('#FFFFFF')
               .fontSize(9)
               .text('Description', 60, currentY + 6)
               .text('Amount', 320, currentY + 6, { width: 60, align: 'right' })
               .text('Qty', 410, currentY + 6, { width: 30, align: 'center' })
               .text('Total', 470, currentY + 6, { width: 70, align: 'right' });
            
            doc.fillColor(darkGray);
            currentY += 30; // Move down after headers
        }

        const qty = item.quantity || 1;
        const total = (item.amount || 0) * qty;

        doc.text(item.description || 'N/A', 60, currentY)
           .text(`INR ${(item.amount || 0).toFixed(2)}`, 320, currentY, { width: 60, align: 'right' })
           .text(qty.toString(), 410, currentY, { width: 30, align: 'center' })
           .text(`INR ${total.toFixed(2)}`, 470, currentY, { width: 70, align: 'right' });
        
        currentY += 20;
    });

    // Divider Line
    doc.strokeColor(lightGray)
       .lineWidth(0.5)
       .moveTo(50, currentY)
       .lineTo(550, currentY)
       .stroke();
    
    currentY += 15;

    // 5. Grand Totals Block
    const totalBlockX = 350;
    doc.fillColor(darkGray)
       .text('Subtotal:', totalBlockX, currentY)
       .text(`INR ${(bill.totalAmount || 0).toFixed(2)}`, 470, currentY, { width: 70, align: 'right' });
    
    currentY += 15;
    doc.text('Discount:', totalBlockX, currentY)
       .text(`INR ${(bill.discount || 0).toFixed(2)}`, 470, currentY, { width: 70, align: 'right' });
    
    currentY += 15;
    doc.text('Tax/GST:', totalBlockX, currentY)
       .text(`INR ${(bill.tax || 0).toFixed(2)}`, 470, currentY, { width: 70, align: 'right' });
    
    currentY += 20;

    // Final Grand Total Highlight
    doc.rect(totalBlockX - 10, currentY - 5, 210, 25).fill(lightGray);
    doc.fillColor(primaryColor)
       .fontSize(10)
       .text('GRAND TOTAL:', totalBlockX, currentY + 3, { bold: true })
       .text(`INR ${(bill.payableAmount || 0).toFixed(2)}`, 470, currentY + 3, { width: 70, align: 'right', bold: true });

    // 6. Status Receipt Stamp (PAID / UNPAID)
    const stampY = currentY + 60;
    const isPaid = bill.paymentStatus === 'paid';
    const stampColor = isPaid ? '#48BB78' : '#E53E3E'; // Green or Red
    
    doc.rect(50, stampY, 150, 45).lineWidth(2).stroke(stampColor);
    doc.fillColor(stampColor)
       .fontSize(16)
       .text((bill.paymentStatus || 'unpaid').toUpperCase(), 60, stampY + 14, { align: 'center', width: 130, bold: true });

    // Payment Method Info
    doc.fillColor(darkGray)
       .fontSize(9)
       .text(`Payment Method: ${(bill.paymentMethod || 'cash').toUpperCase()}`, 60, stampY + 55);

    // 7. Footer Thank you Note
    const footerY = stampY + 110;
    doc.fillColor(darkGray)
       .fontSize(8)
       .text('Thank you for choosing our services. Take care!', 50, footerY, { align: 'center', width: 500 });

    doc.end();
};

const collectDecentralizedPayment = async (data, staffId, hospitalId) => {
    const { module, referenceId, amount, paymentMethod, patient, notes } = data;

    // 1. Create the immutable transaction record
    const transaction = new Transaction({
        amount,
        module,
        referenceId,
        paymentMethod,
        patient,
        collectedBy: staffId,
        hospitalId,
        notes
    });
    await transaction.save();

    // 2. Automatically update the specific module's payment status to 'Paid'
    if (module === 'Pharmacy') {
        await PharmacyOrder.findOneAndUpdate(
            { _id: referenceId, hospitalId },
            { paymentStatus: 'Paid' }
        );
    } else if (module === 'Laboratory') {
        await LabRequest.findOneAndUpdate(
            { _id: referenceId, hospitalId },
            { paymentStatus: 'Paid' }
        );
    } else if (module === 'Appointment') {
        await Appointment.findOneAndUpdate(
            { _id: referenceId, hospitalId },
            { paymentStatus: 'paid' }
        );
    }
    // IPD modules will be added later

    return transaction;
};

const getTransactions = async (userId, role, hospitalId, queryParams) => {
    const filter = {};

    // Role based scoping
    if (role === 'patient') {
        const Auth = require('../auth/auth.model');
        const Patient = require('../patient/patient.model');
        const user = await Auth.findById(userId);
        const patients = await Patient.find({ user: userId });

        filter.$or = [
            { patient: userId },
            { patientId: userId },
            { userId: userId }
        ];
        if (user && user.mobile) filter.$or.push({ mobile: user.mobile });
        if (patients.length > 0) filter.$or.push({ patient: { $in: patients.map(p => p._id) } });
    } else if (role === 'super_admin') {
        if (queryParams.hospitalId) {
            filter.hospitalId = queryParams.hospitalId;
        }
    } else {
        // Staff/Admin - only fetch for their hospital
        filter.hospitalId = hospitalId;
    }

    if (queryParams.module) {
        filter.module = queryParams.module;
    }
    if (queryParams.patientId) {
        filter.patient = queryParams.patientId;
    }

    return await Transaction.find(filter)
        .populate({ path: 'patient', select: 'firstName lastName user', populate: { path: 'user', select: 'email mobile' } })
        .populate({ path: 'collectedBy', select: 'firstName lastName role' })
        .sort({ createdAt: -1 });
};

module.exports = {
    createBilling,
    getBills,
    getBillById,
    updatePayment,
    generateInvoicePDF,
    collectDecentralizedPayment,
    getTransactions
};
