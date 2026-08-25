import React, { useState, useEffect } from 'react';
import { Calendar, Search, Clock, Plus, X, User, MapPin, DollarSign, Filter, MoreVertical, CreditCard, RefreshCw, Eye, CheckCircle, XCircle, CheckSquare, Sun, Cloud, Moon, AlertCircle, QrCode, Copy, Check, Sparkles } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation, Link } from 'react-router-dom';

const ReceptionistAppointments = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filters, setFilters] = useState({
    date: '',
    status: '',
    bookingMode: '',
    doctorId: '',
    searchTerm: ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cancelReason, setCancelReason] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);

  const [formData, setFormData] = useState({
    patient: '',
    doctor: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    appointmentType: 'physical',
    reason: ''
  });

  // If redirected from Manual Registration
  useEffect(() => {
    if (location.state?.registeredPatient) {
      setFormData(prev => ({ ...prev, patient: location.state.registeredPatient._id }));
      setIsModalOpen(true);
    }
  }, [location]);

  useEffect(() => {
    fetchDropdownData();
    fetchAppointments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [appointments, filters]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/appointments');
      setAppointments(res.data.data || []);
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        api.get('/api/v1/patients'),
        api.get('/api/v1/doctors')
      ]);
      setPatients(Array.isArray(patientsRes.data) ? patientsRes.data : (patientsRes.data.data || []));
      setDoctors(doctorsRes.data.doctors || doctorsRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };



  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    let result = [...appointments];
    if (filters.date) {
      result = result.filter(a => a.appointmentDate && a.appointmentDate.split('T')[0] === filters.date);
    }
    if (filters.status) {
      result = result.filter(a => a.status === filters.status);
    }
    if (filters.bookingMode) {
      result = result.filter(a => a.bookingMode === filters.bookingMode);
    }
    if (filters.doctorId) {
      result = result.filter(a => a.doctor?._id === filters.doctorId || a.doctor === filters.doctorId);
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(a => 
        (a.patient?.name && a.patient.name.toLowerCase().includes(term)) ||
        (a.patient?.mobile && a.patient.mobile.includes(term))
      );
    }
    setFilteredAppointments(result);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/api/v1/appointments/${id}/status`, { status });
      addToast('success', `Appointment marked as ${status}`);
      fetchAppointments();
    } catch (err) {
      addToast('error', 'Failed to update status');
    }
  };

  const [confirmPaymentMethod, setConfirmPaymentMethod] = useState('cash');
  const [confirmFee, setConfirmFee] = useState(500);
  const [cashReceived, setCashReceived] = useState('');
  const [onlineTransactionId, setOnlineTransactionId] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  const openConfirmModal = (app) => {
    setSelectedAppointment(app);
    const fee = app.doctor?.consultationFee || app.consultationFee || 500;
    setConfirmFee(fee);
    setCashReceived(fee.toString());
    setOnlineTransactionId('');
    setConfirmPaymentMethod(app.appointmentType !== 'physical' ? 'online' : 'cash');
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAppointment = async () => {
    setSubmitting(true);
    try {
      const isPaid = selectedAppointment.paymentStatus === 'paid' || selectedAppointment.paymentStatus === 'success';
      if (!isPaid) {
        const txId = confirmPaymentMethod === 'online' 
          ? (onlineTransactionId.trim() || `UPI-${Date.now().toString().slice(-8)}`)
          : `CASH-${Date.now().toString().slice(-6)}`;

        const payPayload = {
          status: 'paid',
          paymentMethod: confirmPaymentMethod,
          amount: Number(confirmFee) || 500,
          transactionId: txId,
          notes: `Consultation fee received via ${confirmPaymentMethod.toUpperCase()}`
        };

        await api.patch(`/api/v1/appointments/${selectedAppointment._id}/payment`, payPayload).catch(async (err) => {
          if (err.response?.data?.message?.includes('amount') || err.response?.status === 400) {
            return api.patch(`/api/v1/appointments/${selectedAppointment._id}/payment`, {
              status: 'paid',
              paymentMethod: confirmPaymentMethod
            });
          }
          throw err;
        });
      }

      await api.patch(`/api/v1/appointments/${selectedAppointment._id}/status`, { status: 'confirmed' });
      addToast('success', isPaid ? 'Appointment confirmed successfully!' : `Payment of ₹${confirmFee} received & appointment confirmed!`);
      setIsConfirmModalOpen(false);
      fetchAppointments();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to confirm appointment';
      addToast('error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const openCancelModal = (app) => {
    setSelectedAppointment(app);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  const handleCancelAppointment = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      addToast('error', 'Please provide a reason for cancellation');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/api/v1/appointments/${selectedAppointment._id}/status`, { 
        status: 'cancelled',
        cancelReason: cancelReason
      });
      addToast('success', 'Appointment cancelled');
      setIsCancelModalOpen(false);
      fetchAppointments();
    } catch (err) {
      addToast('error', 'Failed to cancel appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const openPaymentModal = (app) => {
    setSelectedAppointment(app);
    setPaymentMethod('cash');
    setIsPaymentModalOpen(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/api/v1/appointments/${selectedAppointment._id}/payment`, { 
        status: 'paid',
        paymentMethod: paymentMethod 
      });
      addToast('success', 'Payment marked as received');
      setIsPaymentModalOpen(false);
      fetchAppointments();
    } catch (err) {
      addToast('error', 'Failed to update payment status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateSlots = () => {
    if (!formData.doctor || !formData.appointmentDate) return [];
    
    const selectedDoctor = doctors.find(d => d._id === formData.doctor);
    if (!selectedDoctor) return [];

    const dateObj = new Date(formData.appointmentDate);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[dateObj.getDay()];
    
    // Support nested doctorDetails or flat availabilitySchedule
    const scheduleForDay = selectedDoctor.doctorDetails?.availabilitySchedule?.filter(s => s.day === dayName) || 
                           selectedDoctor.availabilitySchedule?.filter(s => s.day === dayName) || [];
    
    if (scheduleForDay.length === 0) return [];
    
    const slots = [];
    
    scheduleForDay.forEach(block => {
      let current = block.startTime;
      while (current < block.endTime) {
        const [h, m] = current.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m, 0);
        date.setMinutes(date.getMinutes() + 30); // Use 30 min default or fetch from doctorDetails.consultationDuration
        
        const nextH = String(date.getHours()).padStart(2, '0');
        const nextM = String(date.getMinutes()).padStart(2, '0');
        const nextTime = `${nextH}:${nextM}`;
        
        if (nextTime <= block.endTime) {
          slots.push({
            startTime: current,
            endTime: nextTime,
            available: true
          });
        }
        current = nextTime;
      }
    });
    
    return slots;
  };

  useEffect(() => {
    if (formData.doctor && formData.appointmentDate) {
      setAvailableSlots(generateSlots());
      // Only reset if it's not already empty to prevent infinite loop or clearing selected slots
    }
  }, [formData.doctor, formData.appointmentDate, doctors]);

  const handleBookWalkIn = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isOnline = formData.appointmentType !== 'physical';
      const payload = {
        ...formData,
        type: formData.appointmentType,
        hospital: user?.hospitalId,
        bookingMode: isOnline ? 'online' : 'walk-in'
      };

      await api.post('/api/v1/appointments', payload);
      addToast('success', `${isOnline ? 'Virtual' : 'Walk-in'} appointment booked successfully`);
      setIsModalOpen(false);
      fetchAppointments();
      
      setFormData({
        patient: '', doctor: '', appointmentDate: '',
        startTime: '', endTime: '', appointmentType: 'physical', reason: ''
      });
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const openViewDetails = (app) => {
    setSelectedAppointment(app);
    setIsViewDetailsOpen(true);
  };

  const openRescheduleModal = (app) => {
    setSelectedAppointment(app);
    setFormData({
      doctor: app.doctor?._id || app.doctor,
      appointmentDate: app.appointmentDate ? app.appointmentDate.split('T')[0] : '',
      startTime: app.startTime || '',
      endTime: app.endTime || '',
      patient: app.patient?._id || app.patient,
      appointmentType: app.appointmentType || app.type || 'physical',
      reason: app.reason || ''
    });
    setIsRescheduleModalOpen(true);
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/api/v1/appointments/${selectedAppointment._id}/reschedule`, {
        appointmentDate: formData.appointmentDate,
        startTime: formData.startTime,
        endTime: formData.endTime
      });
      addToast('success', 'Appointment rescheduled successfully');
      setIsRescheduleModalOpen(false);
      fetchAppointments();
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to reschedule');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Patient Info',
      accessor: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.patient?.name || (row.patient?.firstName ? row.patient.firstName + ' ' + row.patient.lastName : 'Unknown')}</p>
          <p className="text-xs text-slate-500">{row.patient?.mobile || row.patient?.email || 'No contact'}</p>
        </div>
      )
    },
    {
      header: 'Doctor',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <User size={16} className="text-slate-400" />
          <span className="font-medium text-slate-700">{row.doctor?.name || 'Unknown'}</span>
        </div>
      )
    },
    {
      header: 'Date & Time',
      accessor: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar size={14} />
            <span className="text-sm">{row.appointmentDate ? new Date(row.appointmentDate).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Clock size={14} />
            <span>{row.startTime} - {row.endTime}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Type/Mode',
      accessor: (row) => {
        const apptType = row.appointmentType || row.type || 'physical';
        const isVirtual = ['video', 'chat', 'audio'].includes(apptType);
        return (
          <div className="flex flex-col items-start gap-1">
            <Badge variant={row.bookingMode === 'walk-in' ? 'info' : 'secondary'} className="text-[10px] capitalize">
              {row.bookingMode || (isVirtual ? 'online' : 'walk-in')}
            </Badge>
            <Badge variant={isVirtual ? (apptType === 'video' ? 'info' : 'warning') : 'outline'} className="text-[10px] capitalize">
              {apptType}
            </Badge>
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: (row) => {
        const variants = { pending: 'warning', confirmed: 'info', completed: 'success', cancelled: 'danger' };
        return <Badge variant={variants[row.status] || 'default'}>{row.status}</Badge>;
      }
    },
    {
      header: 'Payment',
      accessor: (row) => (
        <Badge variant={row.paymentStatus === 'paid' ? 'success' : 'danger'} className="text-[10px]">
          {row.paymentStatus || 'pending'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <button title="View Details" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors tooltip-trigger" onClick={(e) => { e.stopPropagation(); openViewDetails(row); }}>
            <Eye size={18} />
          </button>
          
          {row.status === 'pending' && (
            <button title="Confirm & Collect Payment" className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" onClick={(e) => { e.stopPropagation(); openConfirmModal(row); }}>
              <CheckCircle size={18} />
            </button>
          )}

          {(row.paymentStatus === 'pending' || !row.paymentStatus) && (
            <button title="Collect Payment" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={(e) => { e.stopPropagation(); openPaymentModal(row); }}>
              <CreditCard size={18} />
            </button>
          )}

          {(row.status === 'pending' || row.status === 'confirmed') && (
            <button title="Reschedule" className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" onClick={(e) => { e.stopPropagation(); openRescheduleModal(row); }}>
              <RefreshCw size={18} />
            </button>
          )}

          {(row.status === 'pending' || row.status === 'confirmed') && (
            <button title="Cancel" className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" onClick={(e) => { e.stopPropagation(); openCancelModal(row); }}>
              <XCircle size={18} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
          <p className="text-slate-500">Manage all walk-in and online hospital appointments</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2 shadow-sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> Book New Appointment
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 flex flex-wrap gap-4 items-end bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-2 text-slate-500 mb-1 w-full md:w-auto">
          <Filter size={18} />
          <span className="font-medium text-sm">Filters:</span>
        </div>
        
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
          <input 
            type="date" 
            name="date" 
            value={filters.date} 
            onChange={handleFilterChange} 
            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
          <select 
            name="status" 
            value={filters.status} 
            onChange={handleFilterChange} 
            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Booking Mode</label>
          <select 
            name="bookingMode" 
            value={filters.bookingMode} 
            onChange={handleFilterChange} 
            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
          >
            <option value="">All Modes</option>
            <option value="online">Online</option>
            <option value="walk-in">Walk-in</option>
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Doctor</label>
          <select 
            name="doctorId" 
            value={filters.doctorId} 
            onChange={handleFilterChange} 
            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
          >
            <option value="">All Doctors</option>
            {doctors.map(d => (
              <option key={d._id} value={d._id}>Dr. {d.name}</option>
            ))}
          </select>
        </div>

        <Button variant="outline" className="text-sm px-3 py-1.5 h-[34px]" onClick={() => setFilters({date:'',status:'',bookingMode:'',doctorId:''})}>
          Clear
        </Button>
      </Card>

      <Card className="p-0 overflow-hidden border border-slate-200">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-slate-100 rounded"></div>)}
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredAppointments}
            searchPlaceholder="Search by patient or doctor name..."
            searchKeys={['patient.name', 'doctor.name']}
          />
        )}
      </Card>

      {/* Book Walk-in Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Book New Appointment</h2>
                <p className="text-sm text-slate-500">Walk-in booking for patients</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="booking-form" onSubmit={handleBookWalkIn} className="space-y-6">
                
                {/* Step 1: Patient */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs">1</div> Patient Details</h3>
                    <Link to="/staff/register" className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
                      <Plus size={16} /> Register New Patient
                    </Link>
                  </div>

                  <div className="space-y-2">
                    <select 
                      name="patient" 
                      value={formData.patient} 
                      onChange={handleFormChange} 
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                      <option value="">Search and select existing patient...</option>
                      {patients.map(p => (
                        <option key={p._id} value={p._id}>{p.name || p.firstName + ' ' + p.lastName} — {p.mobile}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Step 2: Doctor */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4"><div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs">2</div> Select Doctor</h3>
                  <div className="space-y-2">
                    <select 
                      name="doctor" 
                      value={formData.doctor} 
                      onChange={handleFormChange} 
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                      <option value="">-- Choose Doctor --</option>
                      {doctors.map(d => (
                        <option key={d._id} value={d._id}>Dr. {d.name} ({d.specialization}) — Fee: ₹{d.consultationFee}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Step 3: Date & Time */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4"><div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs">3</div> Date & Time</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">Date</label>
                      <input 
                        type="date" 
                        name="appointmentDate" 
                        value={formData.appointmentDate} 
                        onChange={(e) => {
                          handleFormChange(e);
                          setFormData(prev => ({ ...prev, startTime: '', endTime: '' }));
                        }}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {formData.doctor && formData.appointmentDate && (
                    <div className="mt-6">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Available Time Slots</label>
                      {availableSlots.length > 0 ? (
                        <div className="space-y-5">
                          {(() => {
                            const morning = availableSlots.filter(s => parseInt(s.startTime.split(':')[0]) < 12);
                            const afternoon = availableSlots.filter(s => {
                              const h = parseInt(s.startTime.split(':')[0]);
                              return h >= 12 && h < 17;
                            });
                            const evening = availableSlots.filter(s => parseInt(s.startTime.split(':')[0]) >= 17);

                            const renderGroup = (title, slots, icon) => {
                              if (slots.length === 0) return null;
                              return (
                                <div>
                                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {icon} {title}
                                  </div>
                                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {slots.map((slot, index) => {
                                      const isSelected = formData.startTime === slot.startTime;
                                      return (
                                        <button
                                          key={index}
                                          type="button"
                                          onClick={() => setFormData(prev => ({ ...prev, startTime: slot.startTime, endTime: slot.endTime }))}
                                          className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border ${
                                            isSelected 
                                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-[0_4px_12px_rgb(79,70,229,0.3)] transform scale-105' 
                                              : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:-translate-y-0.5'
                                          }`}
                                        >
                                          {slot.startTime}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            };

                            return (
                              <>
                                {renderGroup('Morning', morning, <Sun className="w-3.5 h-3.5 text-orange-400" />)}
                                {renderGroup('Afternoon', afternoon, <Cloud className="w-3.5 h-3.5 text-blue-400" />)}
                                {renderGroup('Evening', evening, <Moon className="w-3.5 h-3.5 text-indigo-400" />)}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="p-4 bg-amber-50 text-amber-700 rounded-xl text-sm border border-amber-200 flex items-center">
                          Doctor is not available on this day. Please select another date.
                        </div>
                      )}
                      
                      {!formData.startTime && availableSlots.length > 0 && (
                        <p className="text-xs text-red-500 mt-2 font-medium">Please select a time slot to continue</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 4: Type & Reason */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4"><div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs">4</div> Additional Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">Appointment Type</label>
                      <select 
                        name="appointmentType" 
                        value={formData.appointmentType} 
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      >
                        <option value="physical">Physical (In-person)</option>
                        <option value="video">Video Consultation</option>
                        <option value="audio">Audio Consultation</option>
                        <option value="chat">Chat Consultation</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">Reason / Symptoms (Optional)</label>
                      <input 
                        type="text" 
                        name="reason" 
                        value={formData.reason} 
                        onChange={handleFormChange}
                        placeholder="e.g. Fever, Follow-up"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="px-6">
                Cancel
              </Button>
              <Button type="submit" form="booking-form" disabled={submitting} className="bg-teal-600 hover:bg-teal-700 px-8 shadow-md shadow-teal-500/20">
                {submitting ? 'Booking...' : 'Confirm Appointment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {isRescheduleModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Reschedule</h2>
                <p className="text-sm text-slate-500">
                  {selectedAppointment.patient?.name || (selectedAppointment.patient?.firstName ? selectedAppointment.patient.firstName + ' ' + selectedAppointment.patient.lastName : 'Unknown')} with Dr. {selectedAppointment.doctor?.name || (selectedAppointment.doctor?.user?.firstName ? selectedAppointment.doctor.user.firstName + ' ' + selectedAppointment.doctor.user.lastName : '')}
                </p>
              </div>
              <button onClick={() => setIsRescheduleModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <form id="reschedule-form" onSubmit={handleReschedule} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">New Date</label>
                  <input 
                    type="date" 
                    name="appointmentDate" 
                    value={formData.appointmentDate} 
                    onChange={handleFormChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Start Time</label>
                    <input 
                      type="time" 
                      name="startTime" 
                      value={formData.startTime} 
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">End Time</label>
                    <input 
                      type="time" 
                      name="endTime" 
                      value={formData.endTime} 
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setIsRescheduleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="reschedule-form" disabled={submitting} className="bg-teal-600 hover:bg-teal-700">
                {submitting ? 'Saving...' : 'Update Schedule'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Drawer/Modal */}
      {isViewDetailsOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Appointment Details</h2>
              <button onClick={() => setIsViewDetailsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="bg-teal-50 p-4 rounded-xl">
                <p className="text-sm text-teal-800 font-medium mb-1">Status</p>
                <div className="flex gap-2 items-center">
                  <Badge variant={selectedAppointment.status === 'pending' ? 'warning' : selectedAppointment.status === 'confirmed' ? 'info' : selectedAppointment.status === 'completed' ? 'success' : 'danger'}>{selectedAppointment.status}</Badge>
                  <Badge variant={selectedAppointment.paymentStatus === 'paid' ? 'success' : 'danger'}>{selectedAppointment.paymentStatus || 'Payment Pending'}</Badge>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Patient Information</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                    {selectedAppointment.patient?.name?.charAt(0) || selectedAppointment.patient?.firstName?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{selectedAppointment.patient?.name || (selectedAppointment.patient?.firstName ? selectedAppointment.patient.firstName + ' ' + selectedAppointment.patient.lastName : 'Unknown')}</p>
                    <p className="text-sm text-slate-500">{selectedAppointment.patient?.mobile || selectedAppointment.patient?.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Doctor</p>
                <p className="font-medium text-slate-800">Dr. {selectedAppointment.doctor?.name}</p>
                <p className="text-sm text-slate-500">{selectedAppointment.doctor?.specialization}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Schedule</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Date</p>
                    <p className="font-medium text-slate-800">{new Date(selectedAppointment.appointmentDate).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Time</p>
                    <p className="font-medium text-slate-800">{selectedAppointment.startTime} - {selectedAppointment.endTime}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Details</p>
                <p className="text-sm text-slate-700 capitalize"><span className="font-medium">Type:</span> {selectedAppointment.appointmentType || selectedAppointment.type || 'physical'}</p>
                <p className="text-sm text-slate-700 capitalize"><span className="font-medium">Mode:</span> {selectedAppointment.bookingMode || (['video', 'chat', 'audio'].includes(selectedAppointment.appointmentType || selectedAppointment.type) ? 'online' : 'walk-in')}</p>
                <p className="text-sm text-slate-700 mt-2"><span className="font-medium">Reason:</span> {selectedAppointment.reason || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {isCancelModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-red-600">Cancel Appointment</h2>
                <p className="text-sm text-slate-500">
                  {selectedAppointment.patient?.name || (selectedAppointment.patient?.firstName ? selectedAppointment.patient.firstName + ' ' + selectedAppointment.patient.lastName : 'Unknown')} with Dr. {selectedAppointment.doctor?.name || (selectedAppointment.doctor?.user?.firstName ? selectedAppointment.doctor.user.firstName + ' ' + selectedAppointment.doctor.user.lastName : '')}
                </p>
              </div>
              <button onClick={() => setIsCancelModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <form id="cancel-form" onSubmit={handleCancelAppointment} className="space-y-4">
                <p className="text-sm text-slate-700">Are you sure you want to cancel this appointment? This action cannot be undone.</p>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Reason for cancellation <span className="text-red-500">*</span></label>
                  <textarea 
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    required
                    rows="3"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Please provide a reason..."
                  />
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setIsCancelModalOpen(false)}>
                Keep Appointment
              </Button>
              <Button type="submit" form="cancel-form" disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white">
                {submitting ? 'Cancelling...' : 'Yes, Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Appointment Modal */}
      {isConfirmModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-100 max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  selectedAppointment.paymentStatus === 'paid' || selectedAppointment.paymentStatus === 'success'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {selectedAppointment.paymentStatus === 'paid' || selectedAppointment.paymentStatus === 'success' ? (
                    <CheckCircle size={20} />
                  ) : (
                    <CreditCard size={20} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {selectedAppointment.paymentStatus === 'paid' ? 'Confirm Appointment' : 'Payment Collection & Confirmation'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedAppointment.paymentStatus === 'paid' ? 'Verify details to confirm booking' : 'Record consultation fee and confirm booking'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsConfirmModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Summary Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Patient</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedAppointment.patient?.name || (selectedAppointment.patient?.firstName ? `${selectedAppointment.patient.firstName} ${selectedAppointment.patient.lastName}` : 'Unknown')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Doctor</span>
                  <span className="font-semibold text-slate-800">
                    Dr. {selectedAppointment.doctor?.name || selectedAppointment.doctor?.user?.firstName || 'Assigned'} ({selectedAppointment.doctor?.specialization || 'General'})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Consultation Mode</span>
                  <span className="font-semibold text-indigo-600 capitalize px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-100">
                    {selectedAppointment.appointmentType || selectedAppointment.type || 'Physical'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Date & Slot</span>
                  <span className="font-medium text-slate-700">
                    {new Date(selectedAppointment.appointmentDate).toLocaleDateString()} at {selectedAppointment.startTime}
                  </span>
                </div>
              </div>

              {/* Payment Section (If not paid) */}
              {selectedAppointment.paymentStatus !== 'paid' && selectedAppointment.paymentStatus !== 'success' ? (
                <div className="space-y-4">
                  {/* Fee Banner */}
                  <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 flex justify-between items-center">
                    <div>
                      <span className="text-[11px] font-semibold uppercase text-emerald-800 tracking-wider block">Doctor Consultation Fee</span>
                      <span className="text-xs text-emerald-600">Standard charges for {selectedAppointment.appointmentType || 'Physical'} visit</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-xl text-emerald-700">
                      <span>₹</span>
                      <input
                        type="number"
                        min="0"
                        value={confirmFee}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setConfirmFee(val);
                          setCashReceived(val.toString());
                        }}
                        className="w-20 px-2 py-1 bg-white border border-emerald-300 rounded-lg text-emerald-900 font-bold text-base text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Select Payment Method</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setConfirmPaymentMethod('cash')}
                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          confirmPaymentMethod === 'cash'
                            ? 'border-teal-500 bg-teal-50 text-teal-800 ring-1 ring-teal-500 shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <DollarSign size={16} />
                        Cash Payment
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmPaymentMethod('online')}
                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          confirmPaymentMethod === 'online'
                            ? 'border-teal-500 bg-teal-50 text-teal-800 ring-1 ring-teal-500 shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard size={16} />
                        UPI / Online Transfer
                      </button>
                    </div>
                  </div>

                  {/* Cash Method UI */}
                  {confirmPaymentMethod === 'cash' && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cash Received (₹)</label>
                          <input
                            type="number"
                            min={confirmFee}
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                            placeholder={confirmFee.toString()}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Change Due to Patient</label>
                          <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-bold text-sm">
                            ₹{Math.max(0, (Number(cashReceived) || 0) - Number(confirmFee))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Online / UPI Method UI */}
                  {confirmPaymentMethod === 'online' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5 animate-in fade-in duration-150">
                      <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-200">
                        {/* Dynamic Mock QR Code */}
                        <div className="w-20 h-20 bg-slate-900 rounded-lg flex items-center justify-center text-white shrink-0 p-1">
                          <QrCode size={64} className="text-white" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                            <span>Scan to pay ₹{confirmFee}</span>
                            <Sparkles size={13} className="text-amber-500" />
                          </div>
                          <p className="text-[11px] text-slate-500">Supports GPay, PhonePe, Paytm, BHIM</p>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                              hospital.care@upi
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText('hospital.care@upi');
                                setCopiedUpi(true);
                                setTimeout(() => setCopiedUpi(false), 2000);
                              }}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                            >
                              {copiedUpi ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              {copiedUpi ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Transaction ID / UTR Reference No. (Optional for record)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. UTR429817291837"
                          value={onlineTransactionId}
                          onChange={(e) => setOnlineTransactionId(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                    <Check size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 text-xs">Payment Already Completed</h4>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Fee payment of ₹{selectedAppointment.consultationFee || 500} is verified. You can proceed with confirming the appointment.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
              <Button variant="outline" className="flex-1 text-xs" onClick={() => setIsConfirmModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs shadow-md shadow-teal-500/20 font-bold py-2.5" 
                onClick={handleConfirmAppointment} 
                disabled={submitting}
              >
                {submitting 
                  ? 'Processing...' 
                  : selectedAppointment.paymentStatus === 'paid' || selectedAppointment.paymentStatus === 'success'
                  ? 'Confirm Appointment' 
                  : `Collect ₹${confirmFee} & Confirm`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Collect Payment</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <form id="payment-form" onSubmit={handleProcessPayment} className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                  <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Patient Name</p>
                  <p className="font-semibold text-slate-800">{selectedAppointment.patient?.name || (selectedAppointment.patient?.firstName ? selectedAppointment.patient.firstName + ' ' + selectedAppointment.patient.lastName : 'Unknown')}</p>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">Payment Method <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`border rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                      <input type="radio" name="paymentMethod" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="sr-only" />
                      <DollarSign size={24} />
                      <span className="font-medium text-sm">Cash</span>
                    </label>
                    <label className={`border rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                      <input type="radio" name="paymentMethod" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="sr-only" />
                      <CreditCard size={24} />
                      <span className="font-medium text-sm">Online</span>
                    </label>
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
              <Button type="submit" form="payment-form" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={submitting}>
                {submitting ? 'Processing...' : 'Mark as Paid'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReceptionistAppointments;
