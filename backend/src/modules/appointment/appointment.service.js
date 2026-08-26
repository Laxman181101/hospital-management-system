const Appointment = require("./appointment.model");
const Doctor = require("../doctor/doctor.model");
const Auth = require("../auth/auth.model");
const notificationEmitter = require("../../services/event.service");

// CREATE APPOINTMENT
const createAppointment = async (data) => {
    // Load doctor and hospital details
    const doctorProfile = await Doctor.findById(data.doctor).populate('hospital');
    if (!doctorProfile) {
        const err = new Error("Doctor profile not found");
        err.status = 404;
        throw err;
    }

    const apptType = data.appointmentType || data.type || 'physical';

    // Layer 1: Hospital Configuration Check
    if (doctorProfile.hospital && doctorProfile.hospital.settings && Array.isArray(doctorProfile.hospital.settings.supportedConsultations)) {
        const supported = doctorProfile.hospital.settings.supportedConsultations;
        if (supported.length > 0 && !supported.includes(apptType) && !(supported.length === 1 && supported[0] === 'physical')) {
            const err = new Error(`Hospital does not support ${apptType} consultations`);
            err.status = 400;
            throw err;
        }
    }

    // Layer 2: Doctor Preference Check
    if (Array.isArray(doctorProfile.consultationModes)) {
        const docSupported = doctorProfile.consultationModes;
        if (docSupported.length > 0 && !docSupported.includes(apptType) && !(docSupported.length === 1 && docSupported[0] === 'physical')) {
            const err = new Error(`Dr. ${doctorProfile.name || 'Doctor'} does not support ${apptType} consultations`);
            err.status = 400;
            throw err;
        }
    }

    // Layer 3: Staff Leave Check
    const startOfDay = new Date(data.appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(data.appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const Leave = require('../staff-leave/leave.model');
    const activeLeave = await Leave.findOne({
        staff: doctorProfile.user,
        startDate: { $lte: endOfDay },
        endDate: { $gte: startOfDay },
        status: 'approved'
    });

    if (activeLeave) {
        const err = new Error("Doctor is on leave on this date");
        err.status = 400;
        throw err;
    }

    // Layer 4: Attendance Check
    const Attendance = require('../attendance/attendance.model');
    const attendanceRecord = await Attendance.findOne({
        staff: doctorProfile.user,
        date: startOfDay
    });

    if (attendanceRecord && (attendanceRecord.status === 'absent' || attendanceRecord.status === 'on_leave')) {
        const err = new Error("Doctor is not available today");
        err.status = 400;
        throw err;
    }

    // CHECK SLOT
    const existingAppointment = await Appointment.findOne({
        doctor: data.doctor,
        appointmentDate: data.appointmentDate,
        startTime: data.startTime,
        status: { $in: ["pending", "confirmed"] },
    });

    // SLOT ALREADY BOOKED
    if (existingAppointment) {
        const err = new Error("Slot already booked");
        err.status = 400;
        throw err;
    }

    // CREATE
    const bMode = data.bookingMode || (apptType === 'physical' ? 'walk-in' : 'online');
    const appointment = await Appointment.create({
        ...data,
        appointmentType: apptType,
        type: apptType,
        bookingMode: bMode
    });

    // --- NOTIFICATION TRIGGER ---
    try {
        const doctorUser = await Doctor.findById(data.doctor).populate('user');
        const patientAuth = await Auth.findById(data.patient);

        if (patientAuth) {
            notificationEmitter.emit('notification:send', {
                recipient: patientAuth._id,
                title: 'Appointment Booked',
                message: `Your appointment with Dr. ${doctorUser?.user?.lastName || doctorUser?.specialization || 'Doctor'} is confirmed for ${new Date(data.appointmentDate).toLocaleDateString()} at ${data.startTime}.`,
                type: 'success',
                relatedData: { appointmentId: appointment._id }
            });
        }

        if (doctorUser && doctorUser.user) {
            notificationEmitter.emit('notification:send', {
                recipient: doctorUser.user._id,
                title: 'New Appointment Scheduled',
                message: `You have a new appointment on ${new Date(data.appointmentDate).toLocaleDateString()} at ${data.startTime}.`,
                type: 'info',
                relatedData: { appointmentId: appointment._id }
            });
        }
    } catch (notifErr) {
        console.error('Failed to send appointment notifications:', notifErr);
    }

    return appointment;
};



// GET MY APPOINTMENTS
const getMyAppointments =
  async (patientId, query = {}) => {
    const Patient = require('../patient/patient.model');
    const patientProfile = await Patient.findOne({ user: patientId });
    
    const patientIds = [patientId];
    if (patientProfile) {
        patientIds.push(patientProfile._id);
    }

    const filter = { patient: { $in: patientIds } };
    if (query.status) filter.status = query.status;
    if (query.bookingMode) filter.bookingMode = query.bookingMode;
    if (query.date) {
      const startOfDay = new Date(query.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(query.date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments =
      await Appointment.find(filter)
        .populate("doctor")
        .populate("hospital")
        .sort({
          createdAt: -1,
        });

    return appointments;
  };



// GET DOCTOR APPOINTMENTS
const getDoctorAppointments =
  async (userId, query = {}) => {

    const doctor = await Doctor.findOne({ user: userId });
    if (!doctor) {
      throw new Error("Doctor profile not found");
    }

    const filter = { doctor: doctor._id };
    if (query.status) filter.status = query.status;
    if (query.bookingMode) filter.bookingMode = query.bookingMode;
    if (query.date) {
      const startOfDay = new Date(query.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(query.date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.$or = [
          { appointmentDate: { $gte: startOfDay, $lte: endOfDay } },
          { date: { $gte: startOfDay, $lte: endOfDay } }
      ];
    }

    const appointments =
      await Appointment.find(filter)
        .populate("patient")
        .populate({
          path: "doctor",
          populate: { path: "user", select: "firstName lastName name specialization profilePicture" }
        })
        .populate("hospital")
        .sort({
          createdAt: -1,
        });

    // Safely populate patient.user for Patient models without crashing Auth models
    await Appointment.populate(appointments, {
      path: "patient.user",
      select: "firstName lastName name email mobile"
    }).catch(() => {});

    return appointments;
  };



// CANCEL APPOINTMENT
const cancelAppointment =
  async (appointmentId, userId, userRole) => {

    const appointment =
      await Appointment.findById(
        appointmentId
      );

    if (!appointment) {

      const err = new Error(
        "Appointment not found"
      );
      err.status = 404;
      throw err;
    }

    // Authorization Check:
    // Admins can cancel any appointment
    const isAdmin = ["super_admin", "hospital_admin", "receptionist"].includes(userRole);
    // Patients can cancel their own
    const isPatient = appointment.patient.toString() === userId;
    // Doctors can cancel their own
    let isDoctor = false;
    if (userRole === "doctor") {
      const doctor = await Doctor.findOne({ user: userId });
      if (doctor && appointment.doctor.toString() === doctor._id.toString()) {
        isDoctor = true;
      }
    }

    if (!isAdmin && !isPatient && !isDoctor) {
      const err = new Error(
        "Forbidden: You do not have permission to cancel this appointment"
      );
      err.status = 403;
      throw err;
    }

    appointment.status =
      "cancelled";

    await appointment.save();

    return appointment;
  };



// UPDATE STATUS
const updateAppointmentStatus =
  async (
    appointmentId,
    status,
    userId,
    userRole
  ) => {

    const appointment =
      await Appointment.findById(
        appointmentId
      );

    if (!appointment) {

      const err = new Error(
        "Appointment not found"
      );
      err.status = 404;
      throw err;
    }

    // Authorization Check:
    // Admins can update any status
    const isAdmin = ["super_admin", "hospital_admin", "receptionist"].includes(userRole);
    // Doctors can update status of their own appointments
    let isDoctor = false;
    if (userRole === "doctor") {
      const doctor = await Doctor.findOne({ user: userId });
      if (doctor && appointment.doctor.toString() === doctor._id.toString()) {
        isDoctor = true;
      }
    }

    if (!isAdmin && !isDoctor) {
      const err = new Error(
        "Forbidden: Only doctors or admins can update appointment status"
      );
      err.status = 403;
      throw err;
    }

    if (userRole === "receptionist" && status === "completed") {
      const err = new Error(
        "Only the attending doctor can mark a consultation as completed after the visit."
      );
      err.status = 403;
      throw err;
    }

    if (status === 'confirmed' && appointment.paymentStatus !== 'paid' && appointment.paymentStatus !== 'success') {
      const err = new Error(
        "Cannot confirm appointment without fee payment. Payment status is pending."
      );
      err.status = 400;
      throw err;
    }

    appointment.status =
      status;

    await appointment.save();

    return appointment;
  };



// GET AVAILABLE SLOTS (Booked slots to infer availability)
const getAvailableSlots = async (doctorId, date) => {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const doctorDoc = await Doctor.findById(doctorId).populate('hospital');
  if (!doctorDoc) {
      throw new Error('Doctor profile not found');
  }

  const Leave = require('../staff-leave/leave.model');
  const Attendance = require('../attendance/attendance.model');

  // 1. Check Approved Leaves
  const activeLeave = await Leave.findOne({
      staff: doctorDoc.user,
      startDate: { $lte: endOfDay },
      endDate: { $gte: startOfDay },
      status: 'approved'
  });

  if (activeLeave) {
      return { 
          available: false, 
          status: 'on_leave', 
          message: 'Doctor is on leave on this date', 
          slots: [], 
          booked: [] 
      };
  }

  // 2. Check Daily Attendance
  const attendanceRecord = await Attendance.findOne({
      staff: doctorDoc.user,
      date: { $gte: startOfDay, $lte: endOfDay }
  });

  if (attendanceRecord) {
      if (attendanceRecord.status === 'absent') {
          return { 
              available: false, 
              status: 'absent', 
              message: 'Doctor is absent today', 
              slots: [], 
              booked: [] 
          };
      }
      if (attendanceRecord.status === 'on_leave') {
          return { 
              available: false, 
              status: 'on_leave', 
              message: 'Doctor is on leave today', 
              slots: [], 
              booked: [] 
          };
      }
  }

  let delayMinutes = 0;
  if (attendanceRecord && attendanceRecord.status === 'late') {
      delayMinutes = attendanceRecord.delayMinutes || 0;
  }

  // 3. Find day availability shift
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = daysOfWeek[startOfDay.getUTCDay()];
  const daySchedule = doctorDoc.availabilitySchedule.find(s => s.day === dayName);

  if (!daySchedule) {
      return { 
          available: false, 
          status: 'off_duty', 
          message: `Doctor is not scheduled to work on ${dayName}s`, 
          slots: [], 
          booked: [] 
      };
  }

  const slotDuration = doctorDoc.consultationDuration || doctorDoc.hospital?.settings?.slotDurationMinutes || 15;

  const parseTimeString = (timeStr, baseDate, delayMins = 0) => {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours !== 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      const d = new Date(baseDate);
      d.setHours(hours, minutes + delayMins, 0, 0);
      return d;
  };

  const shiftStart = parseTimeString(daySchedule.startTime, startOfDay, delayMinutes);
  const shiftEnd = parseTimeString(daySchedule.endTime, startOfDay);

  if (shiftStart >= shiftEnd) {
      return {
          available: false,
          status: 'delayed_past_shift',
          message: 'Doctor arrival delay exceeds scheduled shift hours',
          slots: [],
          booked: []
      };
  }

  // 4. Generate dynamic slots
  const slots = [];
  let currentSlotStart = new Date(shiftStart);
  
  const formatTime = (date) => {
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const modifier = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${String(hours).padStart(2, '0')}:${minutes} ${modifier}`;
  };

  while (currentSlotStart < shiftEnd) {
      const currentSlotEnd = new Date(currentSlotStart.getTime() + slotDuration * 60 * 1000);
      if (currentSlotEnd > shiftEnd) break;

      const slotStr = `${formatTime(currentSlotStart)} - ${formatTime(currentSlotEnd)}`;
      slots.push({
          startTime: formatTime(currentSlotStart),
          endTime: formatTime(currentSlotEnd),
          slot: slotStr,
          isBooked: false
      });
      currentSlotStart = currentSlotEnd;
  }

  // 5. Query and match already booked appointments
  const bookedAppointments = await Appointment.find({
    doctor: doctorId,
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ["pending", "confirmed"] }
  }).select("startTime endTime status slot timeSlot");

  bookedAppointments.forEach(appt => {
      const apptSlotStr = appt.slot || appt.timeSlot;
      const matchedSlot = slots.find(s => s.slot === apptSlotStr || s.startTime === apptSlotStr);
      if (matchedSlot) {
          matchedSlot.isBooked = true;
      }
  });

  return {
      available: true,
      status: 'active',
      delayMinutes,
      slots,
      booked: bookedAppointments
  };
};

// GET ALL APPOINTMENTS
const getAllAppointments = async (query = {}, user) => {
  const isAllowed = ["super_admin", "hospital_admin", "receptionist", "doctor", "financial_manager"].includes(user.role);
  if (!isAllowed) {
    const err = new Error("Forbidden: Staff only");
    err.status = 403;
    throw err;
  }

  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.bookingMode) filter.bookingMode = query.bookingMode;
  if (query.date) {
    const startOfDay = new Date(query.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(query.date);
    endOfDay.setHours(23, 59, 59, 999);
    filter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
  }

  if (user.role !== 'super_admin' && user.hospitalId) {
    filter.hospital = user.hospitalId;
  } else if (query.hospital) {
    filter.hospital = query.hospital;
  }

  const appointments = await Appointment.find(filter)
    .populate("patient")
    .populate({
      path: "doctor",
      populate: { path: "user", select: "firstName lastName name specialization profilePicture" }
    })
    .populate("hospital")
    .sort({ createdAt: -1 });

  await Appointment.populate(appointments, {
    path: "patient.user",
    select: "firstName lastName name email mobile"
  }).catch(() => {});

  return appointments;
};

// GET SINGLE APPOINTMENT
const getAppointmentById = async (appointmentId) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate("patient")
    .populate({
      path: "doctor",
      populate: { path: "user", select: "firstName lastName name specialization profilePicture" }
    })
    .populate("hospital");

  if (appointment) {
    await Appointment.populate(appointment, {
      path: "patient.user",
      select: "firstName lastName name email mobile"
    }).catch(() => {});
  }

  if (!appointment) {
    const err = new Error("Appointment not found");
    err.status = 404;
    throw err;
  }
  return appointment;
};

// RESCHEDULE APPOINTMENT
const rescheduleAppointment = async (appointmentId, data, userId, userRole) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const err = new Error("Appointment not found");
    err.status = 404;
    throw err;
  }

  const isAdmin = ["super_admin", "hospital_admin", "receptionist"].includes(userRole);
  const isPatient = appointment.patient.toString() === userId;
  let isDoctor = false;
  if (userRole === "doctor") {
    const doctor = await Doctor.findOne({ user: userId });
    if (doctor && appointment.doctor.toString() === doctor._id.toString()) {
      isDoctor = true;
    }
  }

  if (!isAdmin && !isPatient && !isDoctor) {
    const err = new Error("Forbidden: You do not have permission to reschedule");
    err.status = 403;
    throw err;
  }

  const existingAppointment = await Appointment.findOne({
    doctor: appointment.doctor,
    appointmentDate: data.appointmentDate,
    startTime: data.startTime,
    status: { $in: ["pending", "confirmed"] },
    _id: { $ne: appointmentId }
  });

  if (existingAppointment) {
    const err = new Error("Slot already booked");
    err.status = 400;
    throw err;
  }

  appointment.appointmentDate = data.appointmentDate;
  appointment.startTime = data.startTime;
  appointment.endTime = data.endTime;

  await appointment.save();
  return appointment;
};

// UPDATE PAYMENT STATUS
const updatePaymentStatus = async (appointmentId, status, userRole, paymentMethod, transactionDetails = {}) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const err = new Error("Appointment not found");
    err.status = 404;
    throw err;
  }

  const isAdmin = ["super_admin", "hospital_admin", "receptionist"].includes(userRole);
  if (!isAdmin) {
    const err = new Error("Forbidden: Admins only");
    err.status = 403;
    throw err;
  }

  appointment.paymentStatus = status;
  if (paymentMethod) {
    appointment.paymentMethod = paymentMethod;
  }
  if (transactionDetails.amount) {
    appointment.consultationFee = transactionDetails.amount;
  }
  if (transactionDetails.transactionId) {
    appointment.razorpayPaymentId = transactionDetails.transactionId;
  }
  if (transactionDetails.notes) {
    appointment.notes = transactionDetails.notes;
  }
  await appointment.save();
  return appointment;
};

// DELETE APPOINTMENT
const deleteAppointment = async (appointmentId, userRole) => {
  const isAdmin = ["super_admin", "hospital_admin", "receptionist"].includes(userRole);
  if (!isAdmin) {
    const err = new Error("Forbidden: Admins only");
    err.status = 403;
    throw err;
  }

  const appointment = await Appointment.findByIdAndDelete(appointmentId);
  if (!appointment) {
    const err = new Error("Appointment not found");
    err.status = 404;
    throw err;
  }
  return appointment;
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  cancelAppointment,
  updateAppointmentStatus,
  getAvailableSlots,
  getAllAppointments,
  getAppointmentById,
  rescheduleAppointment,
  updatePaymentStatus,
  deleteAppointment,
};