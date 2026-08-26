const Medicine = require('./models/medicine.model');
const PharmacyOrder = require('./models/pharmacyOrder.model');

// Medicine Inventory Services
const addMedicine = async (hospitalId, data) => {
    // Check if medicine with same batch already exists in this hospital
    const existing = await Medicine.findOne({ batchNumber: data.batchNumber, hospitalId });
    if (existing) {
        throw new Error('Medicine with this batch number already exists');
    }

    const medicine = new Medicine({ ...data, hospitalId });
    await medicine.save();
    return medicine;
};

const getMedicines = async (hospitalId, queryParams) => {
    const filter = { hospitalId };

    if (queryParams.category) {
        filter.category = queryParams.category;
    }
    if (queryParams.search) {
        filter.name = { $regex: queryParams.search, $options: 'i' };
    }
    // Check stock availability
    if (queryParams.inStock === 'true') {
        filter.stockQuantity = { $gt: 0 };
    }

    return await Medicine.find(filter).sort({ name: 1 });
};

const updateMedicine = async (hospitalId, medicineId, data) => {
    const medicine = await Medicine.findOne({ _id: medicineId, hospitalId });
    if (!medicine) {
        throw new Error('Medicine not found');
    }

    Object.assign(medicine, data);
    await medicine.save();
    return medicine;
};

// Pharmacy Order / Dispensing Services
const createOrder = async (hospitalId, pharmacistId, data) => {
    let totalAmount = 0;
    
    // Process medicines and check stock
    const processedMedicines = [];
    for (const item of data.medicines) {
        const medicine = await Medicine.findOne({ _id: item.medicine, hospitalId });
        if (!medicine) {
            throw new Error(`Medicine with ID ${item.medicine} not found`);
        }
        
        if (medicine.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${medicine.name}. Available: ${medicine.stockQuantity}`);
        }

        const totalPrice = medicine.unitPrice * item.quantity;
        totalAmount += totalPrice;

        processedMedicines.push({
            medicine: medicine._id,
            quantity: item.quantity,
            unitPrice: medicine.unitPrice,
            totalPrice
        });
    }

    // Deduct stock if order is created (we'll assume status is Dispensed by default if not specified, 
    // but the model sets default to 'Pending'. We should probably dispense immediately if pharmacist is creating it,
    // let's create as Pending first and let updateOrderStatus handle stock deduction, OR do it here if status='Dispensed')
    
    const status = data.status || 'Pending';

    if (status === 'Dispensed') {
        for (const item of processedMedicines) {
            await Medicine.findByIdAndUpdate(item.medicine, {
                $inc: { stockQuantity: -item.quantity }
            });
        }
    }

    let order = null;
    if (data.prescription) {
        order = await PharmacyOrder.findOne({ prescription: data.prescription, hospitalId });
    }

    if (order) {
        order.medicines = processedMedicines;
        order.totalAmount = totalAmount;
        order.status = status;
        order.paymentStatus = data.paymentStatus || 'Paid';
        order.paymentMethod = data.paymentMethod || 'Cash';
        order.pharmacist = pharmacistId;
        await order.save();
    } else {
        order = new PharmacyOrder({
            patient: data.patient,
            prescription: data.prescription,
            ipdRound: data.ipdRound,
            medicines: processedMedicines,
            totalAmount,
            status,
            paymentStatus: data.paymentStatus || 'Unpaid',
            paymentMethod: data.paymentMethod || 'Cash',
            patientType: data.patientType || 'OPD',
            pharmacist: pharmacistId,
            hospitalId
        });
        await order.save();
    }

    // If this order is fulfilling an IPD round, mark the IPD round as dispensed
    if (data.ipdRound && status === 'Dispensed') {
        const IpdDailyRound = require('../ward/models/ipdDailyRound.model');
        await IpdDailyRound.findByIdAndUpdate(data.ipdRound, {
            medicationsDispensed: true,
            dispensedAt: new Date(),
            dispensedBy: pharmacistId,
            pharmacyOrderId: order._id
        });
    }

    return order;
};

const getOrders = async (hospitalId, queryParams, userId, role) => {
    const filter = {};

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
    } else {
        if (hospitalId) {
            filter.hospitalId = hospitalId;
        }
        if (queryParams.patient) {
            filter.patient = queryParams.patient;
        }
    }
    if (queryParams.status) {
        filter.status = queryParams.status;
    }

    return await PharmacyOrder.find(filter)
        .populate({ path: 'patient', select: 'firstName lastName name user', populate: { path: 'user', select: 'email mobile' } })
        .populate({ path: 'medicines.medicine', select: 'name category batchNumber expiryDate' })
        .populate({ path: 'pharmacist', select: 'firstName lastName' })
        .populate({ path: 'hospitalId', select: 'hospitalName address email phone' })
        .populate({ path: 'prescription', select: 'doctor consultationId', populate: { path: 'doctor', select: 'firstName lastName name' } })
        .sort({ createdAt: -1 });
};

const updateOrderStatus = async (hospitalId, orderId, status) => {
    const order = await PharmacyOrder.findOne({ _id: orderId, hospitalId });
    if (!order) {
        throw new Error('Pharmacy order not found');
    }

    if (order.status === status) {
        return order; // No change
    }

    // --- OPD Gate Check ---
    if (order.patientType === 'OPD' && status === 'Dispensed' && order.paymentStatus !== 'Paid') {
        // Fallback: Check if a paid centralized bill exists for this prescription
        let hasPaidBill = false;
        if (order.prescription) {
            const Billing = require('../billing/billing.model');
            const paidBill = await Billing.findOne({ prescription: order.prescription, paymentStatus: 'paid', hospital: hospitalId });
            if (paidBill) {
                hasPaidBill = true;
                order.paymentStatus = 'Paid';
                // We don't save here immediately because we save at the end of the function
            }
        }
        
        if (!hasPaidBill) {
            // Assume pharmacist collects the payment directly (Pay As You Go)
            order.paymentStatus = 'Paid';
        }
    }

    // Handle stock changes based on status transition
    if (order.status === 'Pending' && status === 'Dispensed') {
        // Deduct stock
        for (const item of order.medicines) {
            const medicine = await Medicine.findById(item.medicine);
            if (medicine.stockQuantity < item.quantity) {
                throw new Error(`Insufficient stock for one of the medicines (ID: ${item.medicine})`);
            }
            medicine.stockQuantity -= item.quantity;
            await medicine.save();
        }
    } else if (order.status === 'Dispensed' && status === 'Cancelled') {
        // Revert stock
        for (const item of order.medicines) {
            await Medicine.findByIdAndUpdate(item.medicine, {
                $inc: { stockQuantity: item.quantity }
            });
        }
    } else if (order.status === 'Cancelled' && status === 'Dispensed') {
        // Deduct stock again
         for (const item of order.medicines) {
            const medicine = await Medicine.findById(item.medicine);
            if (medicine.stockQuantity < item.quantity) {
                throw new Error(`Insufficient stock for one of the medicines (ID: ${item.medicine})`);
            }
            medicine.stockQuantity -= item.quantity;
            await medicine.save();
        }
    }

    order.status = status;
    await order.save();
    return order;
};

module.exports = {
    addMedicine,
    getMedicines,
    updateMedicine,
    createOrder,
    getOrders,
    updateOrderStatus
};
