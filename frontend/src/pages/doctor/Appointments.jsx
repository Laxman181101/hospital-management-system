import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Search, Clock, MapPin, Activity, Video, MessageSquare, FileText, Plus, X, User, Bed, Pill, Trash2, FlaskConical } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import VideoRoomModal from '../../components/consultation/VideoRoomModal';
import ChatRoomModal from '../../components/consultation/ChatRoomModal';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const DoctorAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoAppt, setActiveVideoAppt] = useState(null);
  const [activeChatAppt, setActiveChatAppt] = useState(null);
  const { addToast } = useToast();
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Consultation Modal States
  const [showModal, setShowModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  
  const [formData, setFormData] = useState({
    symptoms: '',
    complaints: '',
    diagnosis: '',
    clinicalNotes: '',
    observations: '',
    followUpDate: '',
    followUpRecommendations: ''
  });

  const [ipdForm, setIpdForm] = useState({ reason: '', priority: 'Normal' });
  const [showIpdSection, setShowIpdSection] = useState(false);
  const [submittingIpd, setSubmittingIpd] = useState(false);
  const [submittingConsultation, setSubmittingConsultation] = useState(false);

  // Prescription States
  const [inventory, setInventory] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [generalInstructions, setGeneralInstructions] = useState('');
  
  // Lab Tests States
  const [labInventory, setLabInventory] = useState([]);
  const [prescribedLabTests, setPrescribedLabTests] = useState([]);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/api/v1/pharmacy/medicines?inStock=true');
      setInventory(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch inventory');
    }
  };

  const fetchLabInventory = async () => {
    try {
      const res = await api.get('/api/v1/laboratory/tests');
      setLabInventory(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch lab tests');
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);

      const res = await api.get(`/api/v1/appointments/doctor?${params.toString()}`);
      setAppointments(res.data.data || []);
    } catch (err) {
      addToast('error', 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    fetchInventory();
    fetchLabInventory();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/api/v1/appointments/${id}/status`, { status: newStatus });
      addToast('success', `Appointment marked as ${newStatus}`);
      fetchAppointments();
    } catch (err) {
      addToast('error', `Failed to update status to ${newStatus}`);
    }
  };

  const handleStartConsultation = (appt) => {
    setSelectedAppt(appt);
    setFormData({
      symptoms: '',
      complaints: '',
      diagnosis: '',
      clinicalNotes: '',
      observations: '',
      followUpDate: '',
      followUpRecommendations: ''
    });
    setMedicines([]);
    setPrescribedLabTests([]);
    setGeneralInstructions('');
    setIpdForm({ reason: '', priority: 'Normal' });
    setShowIpdSection(false);
    setShowModal(true);
  };

  const [activeMedicineIndex, setActiveMedicineIndex] = useState(null);

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '', isOutsidePharmacy: false }]);
  };

  const handleRemoveMedicine = (index) => {
    const updated = [...medicines];
    updated.splice(index, 1);
    setMedicines(updated);
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSubmitConsultation = async (e) => {
    e.preventDefault();
    if (submittingConsultation) return; // Prevent double-submit
    setSubmittingConsultation(true);
    try {
      // 1. Check medicine stock first
      if (medicines.length > 0) {
        for (const med of medicines) {
          if (!med.name) continue;
          if (!med.isOutsidePharmacy) {
            const isInStock = inventory.some(item => item.name.toLowerCase() === med.name.trim().toLowerCase());
            if (!isInStock) {
              addToast('error', `Medicine '${med.name}' is not in stock. Select 'For Outside Pharmacy'.`);
              return;
            }
          }
        }
      }

      // 2. Save Consultation
      const rawPatient = selectedAppt.patient;
      const targetPatientId = 
        rawPatient?._id || 
        (typeof rawPatient === 'string' ? rawPatient : '') || 
        rawPatient?.user?._id || 
        rawPatient?.user || 
        selectedAppt.patientId;

      if (!targetPatientId) {
        addToast('error', 'Patient ID could not be identified');
        return;
      }

      let consultationRes = await api.post('/api/v1/consultations', {
        ...formData,
        patientId: targetPatientId,
        patient: targetPatientId,
        appointmentId: selectedAppt._id
      });
      
      // 3. Save Prescription (if any medicines added)
      const validMedicines = medicines.filter(m => m.name.trim() !== '');
      if (validMedicines.length > 0 || generalInstructions) {
        await api.post('/api/v1/prescriptions', {
          patientId: targetPatientId,
          patient: targetPatientId,
          consultationId: consultationRes?.data?.data?._id || consultationRes?.data?._id,
          generalInstructions,
          medicines: validMedicines.length > 0 ? validMedicines : undefined
        });
      }

      // 4. Save Lab Requests (if any lab tests added)
      const validLabTests = prescribedLabTests.filter(t => t.testId);
      if (validLabTests.length > 0) {
        await api.post('/api/v1/laboratory/requests', {
          patient: targetPatientId,
          tests: validLabTests.map(t => t.testId),
          paymentStatus: 'Unpaid' // Default unpaid for OPD
        });
      }

      addToast('success', 'Consultation & Prescription saved successfully');
      setShowModal(false);
      
      // Automatically mark as completed
      await handleUpdateStatus(selectedAppt._id, 'completed');
      fetchAppointments();
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to save clinical data');
    } finally {
      setSubmittingConsultation(false);
    }
  };

  const handleRequestIPD = async () => {
    if (!selectedAppt?.patient?._id) return;
    setSubmittingIpd(true);
    try {
      await api.post('/api/v1/ward/admission-requests', {
        patient: selectedAppt.patient._id,
        consultationId: selectedAppt._id,
        reason: ipdForm.reason,
        priority: ipdForm.priority,
      });
      addToast('success', 'IPD Admission requested successfully');
      setShowIpdSection(false);
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to submit IPD request');
    } finally {
      setSubmittingIpd(false);
    }
  };

  const columns = [
    {
      header: 'Patient',
      key: 'patient',
      sortable: true,
      render: (row) => {
        const p = row.patient;
        const patientName = 
          (p?.user ? `${p.user.firstName || ''} ${p.user.lastName || ''}`.trim() : '') ||
          (p?.firstName ? `${p.firstName} ${p.lastName || ''}`.trim() : '') ||
          p?.name ||
          row.patientName ||
          row.name ||
          'Patient';

        const patientId = 
          p?.uhid || 
          p?.patientId || 
          (p?._id ? p._id.toString().slice(-6).toUpperCase() : '') || 
          (row._id ? row._id.toString().slice(-6).toUpperCase() : 'N/A');

        const initial = patientName.charAt(0).toUpperCase() || 'P';

        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
              {initial}
            </div>
            <div>
              <div className="font-bold text-slate-900">{patientName}</div>
              <div className="text-sm text-slate-500">ID: {patientId}</div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Date & Time',
      key: 'appointmentDate',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800 flex items-center gap-1">
            <Calendar size={14} className="text-slate-400" />
            {new Date(row.appointmentDate).toLocaleDateString()}
          </div>
          <div className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
            <Clock size={14} className="text-slate-400" />
            {row.startTime}
          </div>
        </div>
      )
    },
    {
      header: 'Type',
      key: 'appointmentType',
      render: (row) => {
        if (row.appointmentType === 'video') {
          return <span className="flex items-center gap-1 text-blue-600 font-semibold text-xs bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200"><Video size={13} /> Video</span>;
        } else if (row.appointmentType === 'chat') {
          return <span className="flex items-center gap-1 text-purple-600 font-semibold text-xs bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200"><MessageSquare size={13} /> Chat</span>;
        }
        return (
          <span className="flex items-center gap-1 capitalize text-slate-700">
            {row.appointmentType === 'physical' ? <MapPin size={14} className="text-emerald-500" /> : <Activity size={14} className="text-blue-500" />}
            {row.appointmentType || 'Physical'}
          </span>
        );
      }
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (row) => <Badge status={row.status}>{row.status}</Badge>
    },
    {
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (row) => {
        const isVirtual = ['video', 'chat', 'audio'].includes(row.appointmentType);
        const isActive = row.status === 'pending' || row.status === 'confirmed';

        if (row.status === 'completed') {
          return (
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                Consulted ✓
              </span>
            </div>
          );
        }

        if (row.status === 'cancelled') {
          return (
            <div className="flex items-center justify-end">
              <span className="text-xs text-slate-400 font-medium">Cancelled</span>
            </div>
          );
        }

        return (
          <div className="flex items-center justify-end gap-1.5">
            {isVirtual && isActive && (
              <Button
                size="sm"
                className={`text-xs py-1 px-2.5 flex items-center gap-1 shadow-sm ${
                  row.appointmentType === 'video'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
                onClick={() => {
                  try {
                    const s = getSocket();
                    if (s) {
                      s.emit('start_call', {
                        toUserId: row.patient?._id || row.patient,
                        patientUserIds: [row.patient?.user?._id, row.patient?.user, row.patient?._id],
                        appointment: row,
                        callerName: user ? `Dr. ${user.firstName} ${user.lastName || ''}`.trim() : 'Doctor',
                        type: row.appointmentType
                      });
                    }
                  } catch (e) {}

                  if (row.appointmentType === 'video' || row.appointmentType === 'audio') {
                    setActiveVideoAppt(row);
                  } else {
                    setActiveChatAppt(row);
                  }
                }}
              >
                {row.appointmentType === 'video' ? <Video size={13} /> : <MessageSquare size={13} />}
                <span>{row.appointmentType === 'video' ? 'Start Call' : 'Chat'}</span>
              </Button>
            )}

            {isActive && (
              <Button size="sm" onClick={() => handleStartConsultation(row)} className="bg-indigo-600 hover:bg-indigo-700 text-xs py-1.5 px-3.5 text-white font-semibold shadow-sm">
                Consult
              </Button>
            )}

            {isActive && (
              <Button 
                variant="outline" 
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 p-1.5"
                onClick={() => handleUpdateStatus(row._id, 'cancelled')}
                title="Cancel Appointment"
              >
                <XCircle size={15} />
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your schedule and update appointment statuses.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <input 
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white min-w-[120px]"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="h-[600px]">
        <DataTable 
          columns={columns} 
          data={appointments} 
          loading={loading}
          keyField="_id"
          emptyIcon={Calendar}
          emptyTitle="No appointments found"
          emptyDescription="There are no appointments matching your current filters."
        />
      </div>

      {/* Consultation Modal */}
      {showModal && selectedAppt && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Clinical Consultation & Prescription</h2>
                <p className="text-sm text-slate-500">
                  Patient: <span className="font-semibold text-slate-800">
                    {(selectedAppt.patient?.user ? `${selectedAppt.patient.user.firstName || ''} ${selectedAppt.patient.user.lastName || ''}`.trim() : '') ||
                     (selectedAppt.patient?.firstName ? `${selectedAppt.patient.firstName} ${selectedAppt.patient.lastName || ''}`.trim() : '') ||
                     selectedAppt.patient?.name ||
                     selectedAppt.patientName ||
                     'Patient'}
                  </span>
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitConsultation} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Symptoms *</label>
                  <textarea 
                    required
                    value={formData.symptoms}
                    onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all h-24 resize-none"
                    placeholder="E.g., Fever, Headache"
                  ></textarea>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Chief Complaints</label>
                  <textarea 
                    value={formData.complaints}
                    onChange={(e) => setFormData({...formData, complaints: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all h-24 resize-none"
                    placeholder="Patient's own words"
                  ></textarea>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Diagnosis *</label>
                <input 
                  type="text"
                  required
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="Primary diagnosis"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Clinical Notes</label>
                <textarea 
                  value={formData.clinicalNotes}
                  onChange={(e) => setFormData({...formData, clinicalNotes: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all h-24 resize-none"
                  placeholder="Detailed findings and notes"
                ></textarea>
              </div>

              {/* Prescription Section */}
              <div className="border border-indigo-100 bg-indigo-50/50 rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-indigo-100/50 pb-3">
                  <h3 className="font-bold text-indigo-900 flex items-center gap-2 text-lg">
                    <Pill size={20} className="text-indigo-600" /> E-Prescription
                  </h3>
                  <Button type="button" size="sm" onClick={handleAddMedicine} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus size={16} className="mr-1" /> Add Medicine
                  </Button>
                </div>

                {medicines.length > 0 ? (
                  <div className="space-y-4">
                    {/* Header Row (Visible on md+ screens) */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-2 text-xs font-bold text-indigo-800 uppercase tracking-wider">
                      <div className="col-span-4">Medicine Name</div>
                      <div className="col-span-2">Dosage</div>
                      <div className="col-span-2">Frequency</div>
                      <div className="col-span-2">Duration</div>
                      <div className="col-span-2 text-center">Options</div>
                    </div>

                    {medicines.map((med, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 bg-white p-4 rounded-xl border border-indigo-100 shadow-sm relative group hover:border-indigo-300 transition-colors">
                        <div className="col-span-12 md:col-span-4 relative">
                          <label className="block text-xs font-medium text-slate-500 mb-1 md:hidden">Medicine Name</label>
                          <input 
                            type="text" 
                            required 
                            value={med.name} 
                            onFocus={() => !med.isOutsidePharmacy && setActiveMedicineIndex(index)}
                            onBlur={() => setTimeout(() => setActiveMedicineIndex(null), 200)}
                            onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                            className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50 focus:bg-white" 
                            placeholder={med.isOutsidePharmacy ? "Type outside medicine" : "Type medicine name..."}
                          />
                          
                          {/* Autocomplete Dropdown */}
                          {!med.isOutsidePharmacy && activeMedicineIndex === index && (
                            <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl">
                              {inventory
                                .filter(item => item.name.toLowerCase().includes(med.name.toLowerCase()))
                                .map((item, idx) => (
                                  <div 
                                    key={idx}
                                    className="p-2.5 text-sm hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center"
                                    onClick={() => {
                                      handleMedicineChange(index, 'name', item.name);
                                      setActiveMedicineIndex(null);
                                    }}
                                  >
                                    <span className="font-medium text-slate-700">{item.name}</span>
                                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Stock: {item.stockQuantity}</span>
                                  </div>
                              ))}
                              {inventory.filter(item => item.name.toLowerCase().includes(med.name.toLowerCase())).length === 0 && (
                                <div className="p-3 text-sm text-slate-500 text-center">
                                  No matches in stock. Try "Outside Pharmacy".
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="col-span-6 md:col-span-2">
                          <label className="block text-xs font-medium text-slate-500 mb-1 md:hidden">Dosage</label>
                          <input 
                            type="text" 
                            value={med.dosage} 
                            onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                            className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50 focus:bg-white" 
                            placeholder="e.g. 1 Tab"
                          />
                        </div>
                        <div className="col-span-6 md:col-span-2">
                          <label className="block text-xs font-medium text-slate-500 mb-1 md:hidden">Frequency</label>
                          <select 
                            value={med.frequency} 
                            onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                            className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50 focus:bg-white"
                          >
                            <option value="">Select...</option>
                            <option value="1-0-0">1-0-0 (Morning)</option>
                            <option value="0-0-1">0-0-1 (Night)</option>
                            <option value="1-0-1">1-0-1 (Twice)</option>
                            <option value="1-1-1">1-1-1 (Thrice)</option>
                            <option value="SOS">SOS (As Needed)</option>
                          </select>
                        </div>
                        <div className="col-span-6 md:col-span-2">
                          <label className="block text-xs font-medium text-slate-500 mb-1 md:hidden">Duration</label>
                          <input 
                            type="text" 
                            value={med.duration} 
                            onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                            className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50 focus:bg-white" 
                            placeholder="e.g. 5 Days"
                          />
                        </div>
                        <div className="col-span-6 md:col-span-2 flex items-center justify-between md:justify-center border-l md:border-indigo-50 pl-4 md:pl-0">
                          <label className="flex items-center gap-2 cursor-pointer group/toggle" title="Check this if prescribing an outside medicine not in inventory">
                            <div className="relative flex items-center">
                              <input 
                                type="checkbox" 
                                checked={med.isOutsidePharmacy}
                                onChange={(e) => handleMedicineChange(index, 'isOutsidePharmacy', e.target.checked)}
                                className="peer sr-only" 
                              />
                              <div className="w-5 h-5 rounded border-2 border-slate-300 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center shadow-sm">
                                <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 scale-0 peer-checked:scale-100 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-slate-500 group-hover/toggle:text-indigo-700 transition-colors leading-tight select-none">
                              Outside<br/>Pharmacy
                            </span>
                          </label>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveMedicine(index)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2 md:absolute md:-right-2 md:-top-2 md:bg-white md:shadow-sm md:border md:border-slate-100 md:opacity-0 group-hover:opacity-100"
                            title="Remove Medicine"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      <label className="text-sm font-semibold text-indigo-900 mb-2 block">General Rx Instructions</label>
                      <input 
                        type="text"
                        value={generalInstructions}
                        onChange={(e) => setGeneralInstructions(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white shadow-sm"
                        placeholder="e.g. Drink plenty of water, avoid spicy food..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white border-2 border-dashed border-indigo-100 rounded-xl">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Pill size={24} />
                    </div>
                    <p className="text-sm font-medium text-slate-600">No medicines prescribed yet.</p>
                    <p className="text-xs text-slate-400 mt-1 mb-4">Add medicines to generate an E-Prescription for this consultation.</p>
                    <Button type="button" onClick={handleAddMedicine} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shadow-sm">
                      <Plus size={16} className="mr-2" /> Add First Medicine
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Follow-up Date</label>
                  <input 
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({...formData, followUpDate: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Follow-up Recommendations</label>
                  <input 
                    type="text"
                    value={formData.followUpRecommendations}
                    onChange={(e) => setFormData({...formData, followUpRecommendations: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="e.g. CBC test required"
                  />
                </div>
              </div>

              {/* Lab Tests Section */}
              <div className="border border-sky-100 bg-sky-50/50 rounded-xl p-5 space-y-4 shadow-sm mt-6">
                <div className="flex items-center justify-between border-b border-sky-100/50 pb-3">
                  <h3 className="font-bold text-sky-900 flex items-center gap-2 text-lg">
                    <FlaskConical size={20} className="text-sky-600" /> Lab Tests
                  </h3>
                  <Button type="button" size="sm" onClick={() => setPrescribedLabTests([...prescribedLabTests, { testId: '', name: '' }])} className="bg-sky-600 hover:bg-sky-700 text-white">
                    <Plus size={16} className="mr-1" /> Add Test
                  </Button>
                </div>

                {prescribedLabTests.length > 0 ? (
                  <div className="space-y-4">
                    {prescribedLabTests.map((test, index) => (
                      <div key={index} className="flex gap-4 items-center bg-white p-3 rounded-xl border border-sky-100 shadow-sm relative group hover:border-sky-300 transition-colors">
                        <div className="flex-1">
                          <select 
                            className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all bg-slate-50 focus:bg-white"
                            value={test.testId}
                            onChange={(e) => {
                              const newTests = [...prescribedLabTests];
                              newTests[index].testId = e.target.value;
                              newTests[index].name = e.target.options[e.target.selectedIndex].text;
                              setPrescribedLabTests(newTests);
                            }}
                            required
                          >
                            <option value="">Select Lab Test...</option>
                            {labInventory.map(t => (
                              <option key={t._id} value={t._id}>{t.testName} ({t.category}) - ₹{t.price}</option>
                            ))}
                          </select>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => {
                            const newTests = [...prescribedLabTests];
                            newTests.splice(index, 1);
                            setPrescribedLabTests(newTests);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-white/50 border border-dashed border-sky-200 rounded-xl">
                    <p className="text-sm text-slate-500">No lab tests prescribed.</p>
                  </div>
                )}
              </div>

              {/* Action Buttons Section */}
              <div className="pt-4 mt-6 flex flex-col gap-4 border-t border-slate-200 sticky bottom-0 bg-white pb-2">
                {/* IPD Admission Section */}
                {showIpdSection ? (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                    <h4 className="font-bold text-purple-900 flex items-center gap-2">
                      <Bed size={18} /> Request IPD Admission
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-slate-700 block mb-1.5">Reason for Admission *</label>
                        <textarea
                          value={ipdForm.reason}
                          onChange={e => setIpdForm({ ...ipdForm, reason: e.target.value })}
                          className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 h-24 resize-none bg-white shadow-sm"
                          placeholder="e.g. Needs IV treatment, post-surgery monitoring..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1.5">Priority</label>
                        <select
                          value={ipdForm.priority}
                          onChange={e => setIpdForm({ ...ipdForm, priority: e.target.value })}
                          className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-purple-500 bg-white shadow-sm"
                        >
                          <option value="Normal">Normal</option>
                          <option value="Urgent">Urgent</option>
                          <option value="Emergency">Emergency</option>
                        </select>
                      </div>
                      <div className="flex items-end gap-3 justify-end md:justify-start pt-2 md:pt-0">
                        <button
                          type="button"
                          onClick={handleRequestIPD}
                          disabled={!ipdForm.reason || submittingIpd}
                          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-lg transition-colors shadow-sm flex items-center justify-center min-w-[140px]"
                        >
                          {submittingIpd ? 'Submitting…' : 'Submit Request'}
                        </button>
                        <button type="button" onClick={() => setShowIpdSection(false)} className="p-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors" title="Cancel IPD Request">
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowIpdSection(true)}
                    className="flex items-center justify-center gap-2 text-sm text-purple-700 hover:text-purple-800 font-bold px-4 py-3 border-2 border-purple-200 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all self-start shadow-sm"
                  >
                    <Bed size={18} /> Request IPD Admission
                  </button>
                )}
                
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="px-6 py-2.5 font-bold" disabled={submittingConsultation}>Cancel</Button>
                  <Button type="submit" disabled={submittingConsultation} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-2.5 font-bold shadow-md">
                    {submittingConsultation ? 'Saving...' : 'Complete Consultation'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeVideoAppt && (
        <VideoRoomModal
          isOpen={Boolean(activeVideoAppt)}
          onClose={() => setActiveVideoAppt(null)}
          consultationData={activeVideoAppt}
          onConsultationComplete={fetchAppointments}
        />
      )}

      {activeChatAppt && (
        <ChatRoomModal
          isOpen={Boolean(activeChatAppt)}
          onClose={() => setActiveChatAppt(null)}
          consultationData={activeChatAppt}
          onSessionEnd={fetchAppointments}
        />
      )}
    </div>
  );
};

export default DoctorAppointments;
