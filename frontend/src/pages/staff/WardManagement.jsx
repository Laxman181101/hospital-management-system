import React, { useState, useEffect } from 'react';
import { Bed, Plus, MoreVertical, Edit2, Trash2, Search, X, Activity, AlertCircle, Clock, Download, ChevronRight, UserPlus, CheckCircle2, LogOut } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';

// Import newly created Modals
import RecordVitalsModal from './components/RecordVitalsModal';
import DischargeModal from './components/DischargeModal';
import TransferModal from './components/TransferModal';
import VitalsChartDrawer from './components/VitalsChartDrawer';

// Helpers
const getWardTypeBadge = (type) => {
  const map = {
    'ICU': 'bg-red-100 text-red-800 border-red-200',
    'Emergency': 'bg-orange-100 text-orange-800 border-orange-200',
    'General': 'bg-blue-100 text-blue-800 border-blue-200',
    'Private': 'bg-purple-100 text-purple-800 border-purple-200',
    'Maternity': 'bg-pink-100 text-pink-800 border-pink-200',
    'Pediatric': 'bg-teal-100 text-teal-800 border-teal-200',
    'Psychiatric': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Isolation': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };
  const classes = map[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}>{type}</span>;
};

const getPriorityBadge = (priority) => {
  if (priority === 'Emergency') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-200 animate-pulse">
        <Activity className="w-3 h-3" />
        {priority}
      </span>
    );
  }
  const classes = priority === 'Urgent' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-blue-100 text-blue-800 border-blue-200';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}>{priority}</span>;
};

const getStatusBadge = (status) => {
  const map = {
    'Admitted': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Discharge Requested': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Discharged': 'bg-slate-100 text-slate-800 border-slate-200',
  };
  const classes = map[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}>{status}</span>;
};

const getWaitTime = (createdAt) => {
  const diffMins = Math.floor((new Date() - new Date(createdAt)) / 60000);
  if (diffMins < 60) return `${diffMins}m`;
  return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
};

// Helper: resolve patient display name regardless of schema shape
const getPatientName = (p) => {
  if (!p) return 'Unknown';
  if (p.name) return p.name;
  const full = `${p.firstName || ''} ${p.lastName || ''}`.trim();
  if (full) return full;
  if (p.user) return `${p.user.firstName || ''} ${p.user.lastName || ''}`.trim() || 'Unknown';
  return 'Unknown';
};

const isWaitTimeCritical = (priority, createdAt) => {
  const diffMins = Math.floor((new Date() - new Date(createdAt)) / 60000);
  if (priority === 'Emergency' && diffMins > 30) return true;
  if (priority !== 'Emergency' && diffMins > 120) return true;
  return false;
};

const WardManagement = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('wards');
  
  // Data States
  const [wards, setWards] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [admissionRequests, setAdmissionRequests] = useState([]);
  const [staff, setStaff] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [vitalsData, setVitalsData] = useState({}); // allocationId -> latest vitals object
  const [isLoading, setIsLoading] = useState(true);
  const [staffSearchDoctor, setStaffSearchDoctor] = useState('');
  const [staffSearchNurse, setStaffSearchNurse] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [admissionFilter, setAdmissionFilter] = useState('All');

  // Modals & Action States
  const [showWardModal, setShowWardModal] = useState(false);
  const [editWard, setEditWard] = useState(null);
  const [wardForm, setWardForm] = useState({ wardName: '', wardType: 'General', totalBeds: '', pricePerDay: '' });
  
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [admitForm, setAdmitForm] = useState({ patient: '', ward: '', bedNumber: '', primaryNurse: '', primaryDoctor: '', depositToggle: false, depositAmount: '', paymentMethod: 'cash' });
  
  // Complex Workflows Modals
  const [activeAdmission, setActiveAdmission] = useState(null);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showRecordVitalsModal, setShowRecordVitalsModal] = useState(false);
  const [showVitalsChart, setShowVitalsChart] = useState(false);

  // Nurse Assignment Dropdown State
  const [assignNurseOpenId, setAssignNurseOpenId] = useState(null);

  const fetchWards = async () => {
    try {
      const res = await api.get('/api/v1/ward/wards');
      setWards(res.data?.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchAdmissions = async () => {
    try {
      const res = await api.get('/api/v1/ward/admissions');
      const adms = res.data?.data || [];
      setAdmissions(adms);
      
      // Fetch latest vitals for active admissions
      const activeAdms = adms.filter(a => a.status === 'Admitted');
      activeAdms.forEach(async (adm) => {
        try {
          // FIX: use the correct vitals endpoint
          const vRes = await api.get(`/api/v1/ward/admissions/${adm._id}/vitals`);
          const vData = vRes.data?.data || [];
          if (vData.length > 0) {
            // Already sorted desc by recordedAt from backend
            setVitalsData(prev => ({ ...prev, [adm._id]: vData[0] }));
          }
        } catch (e) {}
      });
    } catch (err) { console.error(err); }
  };

  const fetchAdmissionRequests = async () => {
    try {
      const res = await api.get('/api/v1/ward/admission-requests');
      const reqs = res.data?.data || [];
      // Sort: Emergency first, then by date
      reqs.sort((a, b) => {
        if (a.priority === 'Emergency' && b.priority !== 'Emergency') return -1;
        if (b.priority === 'Emergency' && a.priority !== 'Emergency') return 1;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
      setAdmissionRequests(reqs);
    } catch (err) { console.error(err); }
  };

  const fetchStaff = async () => {
    try {
      const res = await api.get('/api/v1/auth/staff');
      const allStaff = res.data?.staff || [];
      setStaff(allStaff);
      setDoctors(allStaff.filter(s => s.role === 'doctor'));
      setNurses(allStaff.filter(s => s.role === 'nurse'));
    } catch (err) { console.error('Failed to fetch staff', err); }
  };

  const loadData = async () => {
    await Promise.all([fetchWards(), fetchAdmissions(), fetchAdmissionRequests()]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    fetchStaff();
    
    // Polling every 60s
    const intervalId = setInterval(() => {
      fetchAdmissions();
      fetchAdmissionRequests();
    }, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Dashboard calculations — FIX: use availableBeds from schema (no occupiedBeds field)
  const totalPlatformBeds = wards.reduce((sum, w) => sum + (w.totalBeds || 0), 0);
  const totalAvailable = wards.reduce((sum, w) => sum + (w.availableBeds || 0), 0);
  const totalOccupied = totalPlatformBeds - totalAvailable;
  const occupancyRate = totalPlatformBeds ? Math.round((totalOccupied / totalPlatformBeds) * 100) : 0;
  
  let occupancyColor = 'stroke-emerald-500';
  if (occupancyRate >= 70) occupancyColor = 'stroke-amber-500';
  if (occupancyRate >= 90) occupancyColor = 'stroke-red-500';

  const activeRequests = admissionRequests.filter(r => r.status === 'Pending');
  const criticalRequestsCount = activeRequests.filter(r => r.priority === 'Emergency').length;
  
  const pendingDischargesCount = admissions.filter(a => a.status === 'Discharge Requested').length;

  // Actions
  const handleAssignNurse = async (admissionId, nurseId) => {
    try {
      await api.patch(`/api/v1/ward/admissions/${admissionId}/assign-nurse`, { nurseId });
      showToast('Nurse assigned successfully', 'success');
      setAssignNurseOpenId(null);
      fetchAdmissions();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign nurse', 'error');
      setAssignNurseOpenId(null);
    }
  };

  const handleDeclineRequest = async (id) => {
    if (!window.confirm('Decline this admission request?')) return;
    try {
      await api.patch(`/api/v1/ward/admission-requests/${id}`, { status: 'Cancelled' });
      showToast('Request declined', 'success');
      fetchAdmissionRequests();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to decline request', 'error');
    }
  };

  const exportCSV = () => {
    const headers = ['Patient', 'Ward', 'Bed', 'Admitted Date', 'Status', 'Doctor', 'Nurse'];
    const rows = admissions.map(a => [
      a.patient?.name || 'Unknown',
      a.ward?.wardName || 'Unknown',
      a.bedNumber || '',
      new Date(a.admissionDate).toLocaleDateString(),
      a.status,
      a.primaryDoctor ? `Dr. ${a.primaryDoctor.firstName}` : 'Unassigned',
      a.primaryNurse ? a.primaryNurse.firstName : 'Unassigned'
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "admissions_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Dashboard Strip
  const renderDashboardOverview = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Total Beds</p>
          <p className="text-2xl font-bold text-slate-900">{totalPlatformBeds}</p>
        </div>
        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
          <Bed className="w-6 h-6 text-indigo-600" />
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Occupied / Available</p>
          <p className="text-2xl font-bold text-slate-900">{totalOccupied} <span className="text-lg text-slate-400">/ {totalAvailable}</span></p>
        </div>
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
          <Activity className="w-6 h-6 text-blue-600" />
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
        <div className="relative w-14 h-14">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path className="stroke-slate-100" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className={`${occupancyColor} transition-all duration-1000`} strokeDasharray={`${occupancyRate}, 100`} strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-slate-700">{occupancyRate}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Occupancy Rate</p>
          <p className="text-xs text-slate-400 mt-0.5">Platform wide</p>
        </div>
      </div>
      <div 
        className={`bg-white rounded-2xl shadow-sm border ${criticalRequestsCount > 0 ? 'border-red-200 bg-red-50/30' : 'border-slate-200'} p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all`}
        onClick={() => setActiveTab('requests')}
      >
        <div>
          <p className="text-sm font-medium text-slate-500">Critical Requests</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-slate-900">{criticalRequestsCount}</p>
            {criticalRequestsCount > 0 && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
          </div>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${criticalRequestsCount > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
          <AlertCircle className={`w-6 h-6 ${criticalRequestsCount > 0 ? 'text-red-600' : 'text-slate-400'}`} />
        </div>
      </div>
      
      {/* Pending Discharges Card */}
      <div 
        className={`bg-white rounded-2xl shadow-sm border ${pendingDischargesCount > 0 ? 'border-red-400 bg-red-50 animate-pulse shadow-red-100' : 'border-slate-200'} p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all`}
        onClick={() => { setActiveTab('admissions'); setAdmissionFilter('Discharge Requested'); }}
      >
        <div>
          <p className={`text-sm font-medium ${pendingDischargesCount > 0 ? 'text-red-800' : 'text-slate-500'}`}>Pending Discharges</p>
          <div className="flex items-center gap-2 mt-1">
            <p className={`text-2xl font-bold ${pendingDischargesCount > 0 ? 'text-red-900' : 'text-slate-900'}`}>{pendingDischargesCount}</p>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${pendingDischargesCount > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
          <LogOut className={`w-6 h-6 ${pendingDischargesCount > 0 ? 'text-red-600' : 'text-slate-400'}`} />
        </div>
      </div>
    </div>
  );

  const renderWardsTab = () => {
    if (isLoading) return <div className="space-y-4"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>;
    if (wards.length === 0) return <EmptyState icon={Bed} title="No Wards Found" description="Get started by adding a new ward." />;

    return (
      <div className="space-y-6">
        {wards.map(ward => {
          const wardAdmissions = admissions.filter(a => a.ward?._id === ward._id && a.status === 'Admitted');
          const availableBeds = ward.totalBeds - wardAdmissions.length;
          
          const occupiedNumbers = wardAdmissions.map(a => parseInt(a.bedNumber)).filter(n => !isNaN(n));
          let nextEmptyBedNumber = 1;
          
          return (
            <div key={ward._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    {ward.wardName} {getWardTypeBadge(ward.wardType)}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{availableBeds} of {ward.totalBeds} beds available</p>
                </div>
                {/* Could add ward-level actions here */}
              </div>
              
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {wardAdmissions.map(adm => {
                      const vitals = vitalsData[adm._id];
                      let hasAlert = false;
                      if (vitals) {
                        if (vitals.oxygenSaturation < 92 || vitals.heartRate > 120 || vitals.heartRate < 50) hasAlert = true;
                      }
                      
                      const lengthOfStay = Math.max(1, Math.ceil((new Date() - new Date(adm.admissionDate)) / (1000 * 60 * 60 * 24)));

                      return (
                        <div key={adm._id} className={`bg-white rounded-xl border ${hasAlert ? 'border-red-400 shadow-sm' : 'border-slate-200'} p-4 flex flex-col hover:shadow-md transition-shadow`}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                <Bed className="w-5 h-5 text-indigo-500" />
                                {adm.bedNumber?.toString().includes('Bed') ? adm.bedNumber : `Bed ${adm.bedNumber}`}
                              </p>
                              <p className="text-sm font-medium text-slate-700 mt-1">{getPatientName(adm.patient)}</p>
                            </div>
                            {hasAlert && <Badge variant="danger" className="animate-pulse">Critical Vitals</Badge>}
                          </div>
                          
                          <div className="text-xs text-slate-500 space-y-1.5 mb-4">
                            <p>Admitted: {new Date(adm.admissionDate).toLocaleDateString()} (Day {lengthOfStay})</p>
                            <p>Doctor: {adm.primaryDoctor ? `Dr. ${adm.primaryDoctor.firstName}` : 'Unassigned'}</p>
                            <div className="flex items-center gap-2">
                              <p>Nurse: {adm.primaryNurse ? adm.primaryNurse.firstName : <span className="text-amber-600 font-medium">Unassigned</span>}</p>
                              {!adm.primaryNurse && (
                                <button className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase font-bold tracking-wider hover:bg-amber-200 transition-colors">
                                  Assign Beta
                                </button>
                              )}
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-100">
                              {adm.depositTransaction ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                  Deposit Collected
                                </span>
                              ) : (
                                <a href="/staff/billing" className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                                  No deposit — Collect now
                                </a>
                              )}
                            </div>
                          </div>

                          {vitals ? (
                            <div className="bg-slate-50 rounded-lg p-2.5 mb-4 grid grid-cols-2 gap-2 text-xs">
                              <div><span className="text-slate-400">HR:</span> <span className={`font-medium ${vitals.heartRate > 100 || vitals.heartRate < 60 ? 'text-red-600' : 'text-slate-700'}`}>{vitals.heartRate}</span></div>
                              <div><span className="text-slate-400">SpO2:</span> <span className={`font-medium ${vitals.oxygenSaturation < 95 ? 'text-red-600' : 'text-slate-700'}`}>{vitals.oxygenSaturation}%</span></div>
                              <div><span className="text-slate-400">BP:</span> <span className="font-medium text-slate-700">{vitals.bloodPressure}</span></div>
                              <div><span className="text-slate-400">Temp:</span> <span className="font-medium text-slate-700">{vitals.temperature}°C</span></div>
                            </div>
                          ) : (
                            <div className="bg-slate-50 rounded-lg p-3 mb-4 text-xs text-slate-400 text-center italic">
                              No vitals recorded yet.
                            </div>
                          )}

                          <div className="mt-auto grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                            <button onClick={() => { setActiveAdmission(adm); setShowRecordVitalsModal(true); }} className="text-xs font-medium text-indigo-600 hover:bg-indigo-50 py-1.5 rounded transition-colors text-center">Record Vitals</button>
                            <button onClick={() => { setActiveAdmission(adm); setShowVitalsChart(true); }} className="text-xs font-medium text-slate-600 hover:bg-slate-50 py-1.5 rounded transition-colors text-center">View Chart</button>
                            <button onClick={() => { setActiveAdmission(adm); setShowTransferModal(true); }} className="text-xs font-medium text-slate-600 hover:bg-slate-50 py-1.5 rounded transition-colors text-center col-span-1">Transfer Bed</button>
                            <button onClick={() => { setActiveAdmission(adm); setShowDischargeModal(true); }} className="text-xs font-medium text-red-600 hover:bg-red-50 py-1.5 rounded transition-colors text-center col-span-1">Discharge</button>
                          </div>
                        </div>
                      );
                    })}
                    {/* Render Available Empty Beds */}
                    {Array.from({ length: availableBeds }).map((_, idx) => {
                      while(occupiedNumbers.includes(nextEmptyBedNumber)) {
                        nextEmptyBedNumber++;
                      }
                      const bedNum = nextEmptyBedNumber++;
                      const bedLabel = `Bed ${bedNum}`;
                      
                      return (
                        <div 
                          key={`empty-${idx}`} 
                          className="bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 p-6 flex flex-col items-center justify-center min-h-[220px] hover:bg-indigo-50/50 hover:border-indigo-300 transition-all cursor-pointer group"
                          onClick={() => { setAdmitForm({ patient: '', ward: ward._id, bedNumber: bedNum.toString(), primaryNurse: '', primaryDoctor: '', depositToggle: false, depositAmount: '', paymentMethod: 'cash' }); setShowAdmitModal(true); }}
                        >
                          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-slate-300 group-hover:text-indigo-500 group-hover:scale-110 transition-transform">
                            <Bed className="w-7 h-7" />
                          </div>
                          <p className="font-bold text-slate-600 group-hover:text-indigo-700 text-lg">{bedLabel}</p>
                          <p className="text-xs font-medium text-green-600 mt-1 uppercase tracking-wide">Available</p>
                        </div>
                      );
                    })}
                  </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAdmissionsTab = () => {
    let filteredAdmissions = admissions;
    if (admissionFilter !== 'All') {
      filteredAdmissions = filteredAdmissions.filter(a => a.status === admissionFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filteredAdmissions = filteredAdmissions.filter(a => 
        a.patient?.name?.toLowerCase().includes(q) || 
        a.bedNumber?.toLowerCase().includes(q)
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 border-b border-slate-200 pb-4">
          <div className="flex bg-slate-100 rounded-full p-1 w-full sm:w-auto overflow-x-auto">
            {['All', 'Admitted', 'Discharge Requested', 'Discharged'].map(f => (
              <button key={f} onClick={() => setAdmissionFilter(f)} className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${admissionFilter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by patient name or bed..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV} className="shrink-0"><Download className="w-4 h-4 mr-2" /> Export</Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-3"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
        ) : filteredAdmissions.length === 0 ? (
          <EmptyState icon={Activity} title="No Admissions" description="No patient admissions found matching criteria." />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Patient</th>
                    <th className="px-4 py-3 font-medium">Ward & Bed</th>
                    <th className="px-4 py-3 font-medium">Dates</th>
                    <th className="px-4 py-3 font-medium">Care Team</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAdmissions.map(adm => (
                    <tr key={adm._id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">{getPatientName(adm.patient)}</td>
                      <td className="px-4 py-3">
                        <p className="text-slate-900">{adm.ward?.wardName}</p>
                        <p className="text-xs text-slate-500">Bed {adm.bedNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(adm.admissionDate).toLocaleDateString()}
                        {adm.dischargeDate && ` - ${new Date(adm.dischargeDate).toLocaleDateString()}`}
                      </td>
                      <td className="px-4 py-3 text-slate-600 relative">
                        <p className="text-xs">Dr: {adm.primaryDoctor?.firstName || 'None'}</p>
                        <div className="text-xs flex items-center gap-1 group">
                          Nr: {adm.primaryNurse?.firstName || <span className="text-amber-500">None</span>}
                          {adm.status === 'Admitted' && (
                            <button onClick={() => setAssignNurseOpenId(assignNurseOpenId === adm._id ? null : adm._id)} className="opacity-0 group-hover:opacity-100 p-0.5 bg-slate-200 rounded text-slate-600 hover:bg-slate-300 ml-1">
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        {assignNurseOpenId === adm._id && (
                          <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-lg p-2 z-10 w-52">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Assign Nurse</p>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {nurses.length === 0 ? (
                                <p className="text-xs text-slate-400 px-2 py-1 italic">No nurses found</p>
                              ) : nurses.map(n => (
                                <button key={n._id} onClick={() => handleAssignNurse(adm._id, n._id)} className="block w-full text-left text-xs px-2 py-1.5 hover:bg-indigo-50 hover:text-indigo-700 rounded">
                                  {n.firstName} {n.lastName}
                                </button>
                              ))}
                              <button onClick={() => setAssignNurseOpenId(null)} className="block w-full text-center text-xs px-2 py-1 text-slate-400 mt-1 border-t border-slate-100 pt-2">Cancel</button>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(adm.status)}</td>
                      <td className="px-4 py-3 text-right">
                        {(adm.status === 'Admitted' || adm.status === 'Discharge Requested') && (
                          <div className="flex justify-end gap-2">
                            {adm.status === 'Admitted' && (
                              <button onClick={() => { setActiveAdmission(adm); setShowTransferModal(true); }} className="text-xs font-medium text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors border border-slate-200">
                                Transfer
                              </button>
                            )}
                            <button 
                              onClick={() => { setActiveAdmission(adm); setShowDischargeModal(true); }} 
                              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border ${
                                adm.status === 'Discharge Requested' 
                                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-200 border-red-600 animate-pulse' 
                                  : 'text-red-600 hover:bg-red-50 border-red-100'
                              }`}
                            >
                              {adm.status === 'Discharge Requested' ? 'Process Discharge' : 'Discharge'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRequestsTab = () => {
    return (
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
        ) : admissionRequests.length === 0 ? (
          <EmptyState icon={AlertCircle} title="No Requests" description="No pending admission requests from doctors." />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium">Patient</th>
                    <th className="px-4 py-3 font-medium">Requesting Doctor</th>
                    <th className="px-4 py-3 font-medium">Wait Time</th>
                    <th className="px-4 py-3 font-medium">Reason</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {admissionRequests.map(req => {
                    const isCritical = isWaitTimeCritical(req.priority, req.createdAt);
                    return (
                      <tr key={req._id} className={`hover:bg-slate-50/50 ${req.priority === 'Emergency' ? 'border-l-4 border-l-red-500' : ''}`}>
                        <td className="px-4 py-3">{getPriorityBadge(req.priority)}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{getPatientName(req.patient)}</td>
                        <td className="px-4 py-3 text-slate-600">Dr. {req.doctor?.firstName} {req.doctor?.lastName}</td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1 ${isCritical ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                            <Clock className="w-3 h-3" />
                            {getWaitTime(req.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]" title={req.reason}>{req.reason}</td>
                        <td className="px-4 py-3 text-right">
                          {req.status === 'Admitted' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Admitted
                            </span>
                          ) : req.status === 'Cancelled' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Declined
                            </span>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleDeclineRequest(req._id)} className="text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg transition-colors">
                                Decline
                              </button>
                              <button onClick={() => { 
                                setAdmitForm({ patient: req.patient?._id || '', ward: '', bedNumber: '', primaryNurse: '', primaryDoctor: req.doctor?._id || '', depositToggle: false, depositAmount: '', paymentMethod: 'cash', admissionRequestId: req._id });
                                setShowAdmitModal(true);
                              }} className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-lg transition-colors shadow-sm">
                                Admit Now
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto animate-fade-in bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Ward Management</h1>
          <p className="text-sm text-slate-500 mt-1">Live overview and management of hospital wards, beds, and admissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="text-sm text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
            <Activity className="w-4 h-4" /> Live Sync
          </button>
          <Button onClick={() => { setAdmitForm({ patient: '', ward: '', bedNumber: '', primaryNurse: '', primaryDoctor: '', depositToggle: false, depositAmount: '', paymentMethod: 'cash' }); setShowAdmitModal(true); }}>
            <UserPlus className="w-4 h-4 mr-2" /> Direct Admit
          </Button>
        </div>
      </div>

      {renderDashboardOverview()}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-100 px-6">
          <nav className="flex space-x-8">
            {['wards', 'admissions', 'requests'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } capitalize`}
              >
                {tab === 'requests' ? 'Admission Requests' : tab}
                {tab === 'requests' && activeRequests.length > 0 && (
                  <span className="ml-2 bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">{activeRequests.length}</span>
                )}
                {tab === 'admissions' && pendingDischargesCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
                    {pendingDischargesCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[500px] bg-slate-50/30">
          {activeTab === 'wards' && renderWardsTab()}
          {activeTab === 'admissions' && renderAdmissionsTab()}
          {activeTab === 'requests' && renderRequestsTab()}
        </div>
      </div>

      {/* --- Render Modals --- */}
      
      {showRecordVitalsModal && activeAdmission && (
        <RecordVitalsModal admission={activeAdmission} onClose={() => setShowRecordVitalsModal(false)} onSuccess={fetchAdmissions} />
      )}

      {showVitalsChart && activeAdmission && (
        <VitalsChartDrawer admission={activeAdmission} onClose={() => setShowVitalsChart(false)} />
      )}

      {showDischargeModal && activeAdmission && (
        <DischargeModal admission={activeAdmission} onClose={() => setShowDischargeModal(false)} onSuccess={fetchAdmissions} />
      )}

      {showTransferModal && activeAdmission && (
        <TransferModal admission={activeAdmission} wards={wards} onClose={() => setShowTransferModal(false)} onSuccess={fetchAdmissions} />
      )}

      {/* Direct Admit Modal (Preserved & Adjusted) */}
      {showAdmitModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Admit Patient</h3>
              <button onClick={() => setShowAdmitModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const payload = { ...admitForm };
                if (!payload.depositToggle) {
                  delete payload.depositAmount;
                } else {
                  payload.depositAmount = Number(payload.depositAmount);
                }
                delete payload.depositToggle;
                
                if (!payload.primaryNurse) delete payload.primaryNurse;
                if (!payload.primaryDoctor) delete payload.primaryDoctor;
                if (!payload.admissionRequestId) delete payload.admissionRequestId;
                
                await api.post('/api/v1/ward/admissions', payload);
                if (admitForm.depositToggle && admitForm.depositAmount) {
                  showToast(`Patient admitted. ₹${admitForm.depositAmount} deposit collected.`, 'success');
                } else {
                  showToast('Patient admitted successfully', 'success');
                }
                setShowAdmitModal(false);
                fetchAdmissions();
                fetchAdmissionRequests();
              } catch (err) {
                showToast(err.response?.data?.message || 'Failed to admit patient', 'error');
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Patient ID *</label>
                <Input value={admitForm.patient} onChange={e => setAdmitForm({...admitForm, patient: e.target.value})} placeholder="Patient DB ID" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Ward *</label>
                <select value={admitForm.ward} onChange={e => setAdmitForm({...admitForm, ward: e.target.value})} className="w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm px-4 py-2.5" required>
                  <option value="">-- Choose Ward --</option>
                  {wards.map(w => (
                    <option key={w._id} value={w._id}>{w.wardName} ({w.availableBeds} beds free)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bed Number *</label>
                <Input value={admitForm.bedNumber} onChange={e => setAdmitForm({...admitForm, bedNumber: e.target.value})} placeholder="e.g. B-12" required />
              </div>
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Primary Doctor</label>
                  <select
                    value={admitForm.primaryDoctor}
                    onChange={e => setAdmitForm({...admitForm, primaryDoctor: e.target.value})}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm px-3 py-2.5"
                  >
                    <option value="">-- Select Doctor --</option>
                    {doctors.map(d => (
                      <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Primary Nurse</label>
                  <select
                    value={admitForm.primaryNurse}
                    onChange={e => setAdmitForm({...admitForm, primaryNurse: e.target.value})}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm px-3 py-2.5"
                  >
                    <option value="">-- Select Nurse (Optional) --</option>
                    {nurses.map(n => (
                      <option key={n._id} value={n._id}>{n.firstName} {n.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input type="checkbox" checked={admitForm.depositToggle} onChange={e => setAdmitForm({...admitForm, depositToggle: e.target.checked})} className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4" />
                  <span className="text-sm font-medium text-slate-800">Collect deposit now?</span>
                </label>
                {admitForm.depositToggle && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Amount (₹) *</label>
                      <Input type="number" min="1" required value={admitForm.depositAmount} onChange={e => setAdmitForm({...admitForm, depositAmount: e.target.value})} placeholder="e.g. 5000" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method</label>
                      <select value={admitForm.paymentMethod} onChange={e => setAdmitForm({...admitForm, paymentMethod: e.target.value})} className="w-full rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm px-3 py-2">
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="insurance">Insurance</option>
                      </select>
                    </div>
                    <p className="col-span-2 text-[10px] text-slate-500">You can also collect this later from the Billing page.</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowAdmitModal(false)}>Cancel</Button>
                <Button type="submit">Admit Patient</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WardManagement;
