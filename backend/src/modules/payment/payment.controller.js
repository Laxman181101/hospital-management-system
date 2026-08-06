const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Razorpay = require('razorpay');

const Payment = require('./payment.model');
const Invoice = require('./invoice.model');
const Appointment = require('../appointment/appointment.model');
const Patient = require('../patient/patient.model');
const Doctor = require('../doctor/doctor.model');

const receiptService = require('./receiptService');
const messagingService = require('../patient/messagingService');

// Initialize Razorpay client
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY || 'rzp_test_StJNpcucdPt8Ja',
    key_secret: process.env.RAZORPAY_SECRET || 'LfVmWXkO6fcuK8G41J9pqumy'
});

// ==========================================
// 1. Create Razorpay Order
// ==========================================
const createOrder = async (req, res) => {
    try {
        const { appointmentId, amount } = req.body;

        if (!appointmentId || !amount) {
            return res.status(400).json({ error: 'appointmentId and amount are required.' });
        }

        // Find patient profile using req.user.id
        const targetId = req.user.id || req.user.sub;
        const patientRecord = await Patient.findOne({
            $or: [{ _id: targetId }, { user: targetId }]
        });

        if (!patientRecord) {
            return res.status(404).json({ error: 'Patient profile not found.' });
        }

        // Find appointment
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found.' });
        }

        // Verify appointment belongs to patient
        if (!appointment.patient.equals(patientRecord._id)) {
            return res.status(403).json({ error: 'Access forbidden. This appointment does not belong to you.' });
        }

        // Check appointment status is 'booked'
        if (appointment.status !== 'booked') {
            return res.status(400).json({ error: `Appointment status is '${appointment.status}'. Payment is only allowed for 'booked' status.` });
        }

        // Check no existing paid payment for this appointment
        const existingPaidPayment = await Payment.findOne({
            appointment: appointmentId,
            status: { $in: ['paid', 'success'] }
        });
        if (existingPaidPayment) {
            return res.status(400).json({ error: 'This appointment has already been paid.' });
        }

        // Create Razorpay order
        const amountInPaise = Math.round(amount * 100);
        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: 'receipt_' + appointmentId
        };

        const order = await razorpay.orders.create(options);

        // Save Payment to DB in pending state
        const payment = new Payment({
            patient: patientRecord._id,
            doctor: appointment.doctor,
            appointment: appointmentId,
            razorpayOrderId: order.id,
            amount: amount,
            amountInPaise: amountInPaise,
            currency: 'INR',
            status: 'pending'
        });

        const savedPayment = await payment.save();

        return res.status(201).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY || 'rzp_test_StJNpcucdPt8Ja',
            paymentId: savedPayment._id
        });
    } catch (err) {
        console.error('Error in createOrder:', err);
        return res.status(500).json({ error: err.message || 'Internal server error creating payment order.' });
    }
};

// ==========================================
// 2. Verify Razorpay Payment Signature
// ==========================================
const verifyPayment = async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId, appointmentId } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !paymentId || !appointmentId) {
            return res.status(400).json({ error: 'Missing payment signature verification parameters.' });
        }

        // Verify signature using crypto
        const body = razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET || 'LfVmWXkO6fcuK8G41J9pqumy')
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpaySignature) {
            return res.status(400).json({ error: 'Invalid payment signature. Verification failed.' });
        }

        // Find payment
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ error: 'Payment record not found.' });
        }

        // Find appointment
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found.' });
        }

        // Retrieve Patient & Doctor metadata
        const patient = await Patient.findById(payment.patient);
        const doctor = await Doctor.findById(payment.doctor);

        // Update Payment status to paid
        payment.status = 'paid';
        payment.razorpayPaymentId = razorpayPaymentId;
        payment.razorpaySignature = razorpaySignature;
        payment.paidAt = new Date();
        // Set payment method if supplied, default to 'Razorpay'
        payment.paymentMethod = payment.paymentMethod || req.body.paymentMethod || 'Razorpay';

        // Update Appointment status and link payment
        appointment.payment = payment._id;
        appointment.status = 'confirmed';
        appointment.paymentStatus = 'success';
        await appointment.save();

        // Generate Invoice Number
        const invoiceNumber = 'INV-' + Date.now();

        // Create Invoice record in DB
        const invoice = new Invoice({
            invoiceNumber,
            patient: payment.patient,
            doctor: payment.doctor,
            appointment: appointmentId,
            payment: payment._id,
            hospitalName: process.env.HOSPITAL_NAME || 'City Hospital',
            hospitalAddress: process.env.HOSPITAL_ADDRESS || '123 Main Street, Lucknow, UP',
            hospitalPhone: process.env.HOSPITAL_PHONE || '+91-9999999999',
            items: [{
                description: `Consultation Fee with ${doctor ? doctor.name : 'Doctor'}`,
                quantity: 1,
                unitPrice: payment.amount,
                totalPrice: payment.amount
            }],
            subtotal: payment.amount,
            tax: 0,
            discount: 0,
            totalAmount: payment.amount,
            status: 'generated'
        });

        await invoice.save();

        // Call receiptService to generate PDF
        const invoiceData = {
            invoiceNumber,
            issuedAt: invoice.issuedAt,
            hospitalName: invoice.hospitalName,
            hospitalAddress: invoice.hospitalAddress,
            hospitalPhone: invoice.hospitalPhone,
            appointmentDate: appointment.date,
            appointmentSlot: appointment.slot,
            patientName: patient ? patient.name : 'N/A',
            patientMobile: patient ? patient.mobile : 'N/A',
            doctorName: doctor ? doctor.name : 'N/A',
            doctorSpecialization: doctor ? doctor.specialization : 'N/A',
            items: invoice.items,
            subtotal: invoice.subtotal,
            discount: invoice.discount,
            totalAmount: invoice.totalAmount,
            razorpayPaymentId
        };

        const receiptUrl = await receiptService.generateReceipt(invoiceData);

        // Update Payment with receipt path
        payment.receiptUrl = receiptUrl;
        await payment.save();

        // Send WhatsApp confirmation
        const whatsAppMessage = `Payment of Rs.${payment.amount} confirmed! Invoice: ${invoiceNumber}. Download receipt: http://localhost:5000${receiptUrl}`;
        await messagingService.sendWhatsApp(patient ? patient.mobile : '', whatsAppMessage);

        return res.status(200).json({
            msg: 'Payment verified successfully',
            invoiceNumber,
            receiptUrl
        });
    } catch (err) {
        console.error('Error in verifyPayment:', err);
        return res.status(500).json({ error: err.message || 'Internal server error verifying payment.' });
    }
};

// ==========================================
// 3. Get Payment History
// ==========================================
const getPaymentHistory = async (req, res) => {
    try {
        const role = req.user.role;
        let query = {};

        // Patient views own, admin views all
        if (role === 'patient') {
            const targetId = req.user.id || req.user.sub;
            const patientRecord = await Patient.findOne({
                $or: [{ _id: targetId }, { user: targetId }]
            });
            if (!patientRecord) {
                return res.status(404).json({ error: 'Patient profile not found.' });
            }
            query = { patient: patientRecord._id };
        } else if (role !== 'hospital_admin' && role !== 'super_admin') {
            return res.status(403).json({ error: 'Access forbidden. Insufficient permissions.' });
        }

        const payments = await Payment.find(query)
            .populate('patient', 'name mobile')
            .populate('doctor', 'name specialization')
            .populate('appointment', 'date slot type')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: payments.length,
            payments
        });
    } catch (err) {
        console.error('Error in getPaymentHistory:', err);
        return res.status(500).json({ error: 'Internal server error fetching payment history.' });
    }
};

// ==========================================
// 4. Get Payment By ID
// ==========================================
const getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('patient', 'name mobile')
            .populate('doctor', 'name specialization')
            .populate('appointment', 'date slot type');

        if (!payment) {
            return res.status(404).json({ error: 'Payment record not found.' });
        }

        // Access control: patient owns or admin views
        if (req.user.role === 'patient') {
            const targetId = req.user.id || req.user.sub;
            const patientRecord = await Patient.findOne({
                $or: [{ _id: targetId }, { user: targetId }]
            });
            if (!patientRecord || !payment.patient.equals(patientRecord._id)) {
                return res.status(403).json({ error: 'Access forbidden. You do not own this payment.' });
            }
        }

        return res.status(200).json(payment);
    } catch (err) {
        console.error('Error in getPaymentById:', err);
        return res.status(500).json({ error: 'Internal server error retrieving payment detail.' });
    }
};

// ==========================================
// 5. Download PDF Receipt
// ==========================================
const downloadReceipt = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({ error: 'Payment record not found.' });
        }

        // Verify patient ownership
        if (req.user.role === 'patient') {
            const targetId = req.user.id || req.user.sub;
            const patientRecord = await Patient.findOne({
                $or: [{ _id: targetId }, { user: targetId }]
            });
            if (!patientRecord || !payment.patient.equals(patientRecord._id)) {
                return res.status(403).json({ error: 'Access forbidden. You do not own this payment receipt.' });
            }
        }

        if (!payment.receiptUrl) {
            return res.status(404).json({ error: 'Receipt PDF has not been generated for this payment.' });
        }

        const absolutePath = path.join(__dirname, '../../../', payment.receiptUrl);
        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ error: 'Receipt file does not exist on disk.' });
        }

        const invoice = await Invoice.findOne({ payment: payment._id });
        const downloadName = invoice ? `${invoice.invoiceNumber}.pdf` : 'receipt.pdf';

        return res.download(absolutePath, downloadName);
    } catch (err) {
        console.error('Error in downloadReceipt:', err);
        return res.status(500).json({ error: 'Internal server error downloading receipt.' });
    }
};

// ==========================================
// 6. Get Invoice By ID
// ==========================================
const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('patient', 'name mobile address')
            .populate('doctor', 'name specialization')
            .populate('appointment', 'date slot type')
            .populate('payment', 'razorpayPaymentId status paidAt');

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found.' });
        }

        // Ownership validation
        if (req.user.role === 'patient') {
            const targetId = req.user.id || req.user.sub;
            const patientRecord = await Patient.findOne({
                $or: [{ _id: targetId }, { user: targetId }]
            });
            if (!patientRecord || !invoice.patient.equals(patientRecord._id)) {
                return res.status(403).json({ error: 'Access forbidden. You do not own this invoice.' });
            }
        }

        return res.status(200).json(invoice);
    } catch (err) {
        console.error('Error in getInvoiceById:', err);
        return res.status(500).json({ error: 'Internal server error retrieving invoice detail.' });
    }
};

// ==========================================
// 7. Initiate Refund (Admin Only)
// ==========================================
const initiateRefund = async (req, res) => {
    try {
        const { paymentId, reason } = req.body;

        if (!paymentId) {
            return res.status(400).json({ error: 'paymentId is required.' });
        }

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ error: 'Payment record not found.' });
        }

        // Verify status is paid
        if (payment.status !== 'paid' && payment.status !== 'success') {
            return res.status(400).json({ error: `Cannot refund payment with status '${payment.status}'. Only paid transactions can be refunded.` });
        }

        // Call Razorpay refund API
        const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
            amount: payment.amountInPaise,
            notes: { reason: reason || 'Patient cancelled appointment' }
        });

        // Update Payment status to refunded
        payment.refundId = refund.id;
        payment.refundAmount = payment.amount;
        payment.refundStatus = 'initiated';
        payment.status = 'refunded';
        await payment.save();

        // Update Appointment status to cancelled if needed
        const appointment = await Appointment.findById(payment.appointment);
        if (appointment && appointment.status !== 'cancelled') {
            appointment.status = 'cancelled';
            await appointment.save();
        }

        // Notify patient
        const patient = await Patient.findById(payment.patient);
        const whatsAppMessage = `Refund of Rs.${payment.amount} has been initiated. It will reflect in 5-7 business days.`;
        await messagingService.sendWhatsApp(patient ? patient.mobile : '', whatsAppMessage);

        return res.status(200).json({
            msg: 'Refund initiated',
            refundId: refund.id
        });
    } catch (err) {
        console.error('Error in initiateRefund:', err);
        return res.status(500).json({ error: err.message || 'Internal server error processing refund.' });
    }
};

// ==========================================
// 8. Get Revenue Stats (Admin Only)
// ==========================================
const getRevenueStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Paid query
        const paidQuery = { status: { $in: ['paid', 'success'] } };

        // Total Revenue sum
        const allPayments = await Payment.find(paidQuery);
        const totalRevenue = allPayments.reduce((acc, curr) => acc + curr.amount, 0);

        // Today's Revenue sum
        const todayPayments = await Payment.find({
            ...paidQuery,
            paidAt: { $gte: today }
        });
        const todayRevenue = todayPayments.reduce((acc, curr) => acc + curr.amount, 0);

        // Monthly Revenue sum
        const monthlyPayments = await Payment.find({
            ...paidQuery,
            paidAt: { $gte: startOfMonth }
        });
        const monthlyRevenue = monthlyPayments.reduce((acc, curr) => acc + curr.amount, 0);

        // Transaction status counts
        const totalTransactions = await Payment.countDocuments();
        const pendingCount = await Payment.countDocuments({ status: 'pending' });
        const failedCount = await Payment.countDocuments({ status: 'failed' });

        return res.status(200).json({
            totalRevenue,
            todayRevenue,
            monthlyRevenue,
            totalTransactions,
            pendingCount,
            failedCount
        });
    } catch (err) {
        console.error('Error in getRevenueStats:', err);
        return res.status(500).json({ error: 'Internal server error computing stats.' });
    }
};

// ==========================================
// 9. Razorpay Webhook Handler (Public Endpoint)
// ==========================================
const handleRazorpayWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // Verify webhook signature
        if (webhookSecret && signature) {
            // Note: req.body is parsed as a Buffer because of express.raw parser configured in app.js
            const shasum = crypto.createHmac('sha256', webhookSecret);
            shasum.update(req.body);
            const digest = shasum.digest('hex');

            if (digest !== signature) {
                console.error('[Webhook] Signature verification failed.');
                return res.status(400).json({ error: 'Signature mismatch' });
            }
        }

        // Webhook parsed event data
        const eventData = JSON.parse(req.body.toString());
        const event = eventData.event;
        const payload = eventData.payload;

        console.log(`[Webhook Received] Event: ${event}`);

        if (event === 'payment.captured') {
            const paymentEntity = payload.payment.entity;
            const razorpayPaymentId = paymentEntity.id;
            const razorpayOrderId = paymentEntity.order_id;
            const paymentMethod = paymentEntity.method;

            // Find payment record
            const payment = await Payment.findOne({ razorpayOrderId });
            if (payment && payment.status !== 'paid') {
                payment.status = 'paid';
                payment.razorpayPaymentId = razorpayPaymentId;
                payment.paidAt = new Date();
                payment.paymentMethod = paymentMethod;

                const appointment = await Appointment.findById(payment.appointment);
                if (appointment) {
                    appointment.payment = payment._id;
                    appointment.status = 'confirmed';
                    appointment.paymentStatus = 'success';
                    await appointment.save();
                }

                // Generate Invoice
                const invoiceNumber = 'INV-' + Date.now();
                const patient = await Patient.findById(payment.patient);
                const doctor = await Doctor.findById(payment.doctor);

                const invoice = new Invoice({
                    invoiceNumber,
                    patient: payment.patient,
                    doctor: payment.doctor,
                    appointment: payment.appointment,
                    payment: payment._id,
                    hospitalName: process.env.HOSPITAL_NAME || 'City Hospital',
                    hospitalAddress: process.env.HOSPITAL_ADDRESS || '123 Main Street, Lucknow, UP',
                    hospitalPhone: process.env.HOSPITAL_PHONE || '+91-9999999999',
                    items: [{
                        description: `Consultation Fee with ${doctor ? doctor.name : 'Doctor'}`,
                        quantity: 1,
                        unitPrice: payment.amount,
                        totalPrice: payment.amount
                    }],
                    subtotal: payment.amount,
                    tax: 0,
                    discount: 0,
                    totalAmount: payment.amount,
                    status: 'generated'
                });

                await invoice.save();

                const invoiceData = {
                    invoiceNumber,
                    issuedAt: invoice.issuedAt,
                    hospitalName: invoice.hospitalName,
                    hospitalAddress: invoice.hospitalAddress,
                    hospitalPhone: invoice.hospitalPhone,
                    appointmentDate: appointment ? appointment.date : undefined,
                    appointmentSlot: appointment ? appointment.slot : undefined,
                    patientName: patient ? patient.name : 'N/A',
                    patientMobile: patient ? patient.mobile : 'N/A',
                    doctorName: doctor ? doctor.name : 'N/A',
                    doctorSpecialization: doctor ? doctor.specialization : 'N/A',
                    items: invoice.items,
                    subtotal: invoice.subtotal,
                    discount: invoice.discount,
                    totalAmount: invoice.totalAmount,
                    razorpayPaymentId
                };

                const receiptUrl = await receiptService.generateReceipt(invoiceData);
                payment.receiptUrl = receiptUrl;
                await payment.save();

                const whatsAppMessage = `Payment of Rs.${payment.amount} confirmed! Invoice: ${invoiceNumber}. Download receipt: http://localhost:5000${receiptUrl}`;
                await messagingService.sendWhatsApp(patient ? patient.mobile : '', whatsAppMessage);
            }
        } else if (event === 'payment.failed') {
            const paymentEntity = payload.payment.entity;
            const razorpayOrderId = paymentEntity.order_id;

            const payment = await Payment.findOne({ razorpayOrderId });
            if (payment) {
                payment.status = 'failed';
                await payment.save();

                const appointment = await Appointment.findById(payment.appointment);
                if (appointment) {
                    appointment.paymentStatus = 'failed';
                    await appointment.save();
                }
            }
        } else if (event === 'refund.processed') {
            const refundEntity = payload.refund.entity;
            const refundId = refundEntity.id;
            const razorpayPaymentId = refundEntity.payment_id;

            const payment = await Payment.findOne({ razorpayPaymentId });
            if (payment) {
                payment.refundId = refundId;
                payment.refundStatus = 'processed';
                payment.status = 'refunded';
                await payment.save();
            }
        }

        // Return 200 OK always (Razorpay webhook requirement)
        return res.status(200).send('OK');
    } catch (err) {
        console.error('Error in handleRazorpayWebhook:', err);
        // Always return 200 OK even on error to satisfy Razorpay webhook delivery requirements
        return res.status(200).send('OK');
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    getPaymentHistory,
    getPaymentById,
    downloadReceipt,
    getInvoiceById,
    initiateRefund,
    getRevenueStats,
    handleRazorpayWebhook
};
