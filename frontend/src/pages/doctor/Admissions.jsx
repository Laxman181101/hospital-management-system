import React, { useState, useEffect, useCallback } from 'react';
import {
  Bed, Calendar, FileText, User, Activity, Clock, X, Plus, Trash2,
  ChevronDown, ClipboardList, Pill, Stethoscope, FlaskConical,
  AlertCircle, CheckCircle2, LogOut, RefreshCw, Sunrise, Sunset,
  Moon, Zap, Printer
} from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

// ─── Helpers ────────────────────────────────────────────────────────────────
const getStatusBadge = (status) => {
  switch (status) {
    case 'Admitted':           return <Badge variant="success">Admitted</Badge>;
    case 'Discharged':         return <Badge variant="secondary">Discharged</Badge>;
    case 'Discharge Requested':return <Badge variant="warning">Discharge Requested</Badge>;
    case 'Transferred':        return <Badge variant="info">Transferred</Badge>;
    default:                   return <Badge variant="outline">{status}</Badge>;
  }
};

const ROUND_TYPE_CONFIG = {
  Morning:   { icon: Sunrise,  color: 'text-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-200',  label: 'Subah' },
  Evening:   { icon: Sunset,   color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Shaam' },
  Night:     { icon: Moon,     color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200', label: 'Raat' },
  Emergency: { icon: Zap,      color: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-200',    label: 'Emergency' },
};

const EMPTY_MED = { name: '', dose: '', route: 'Oral', frequency: 'BD', duration: '', instructions: '' };

const formatDateTime = (d) => {
  const date = new Date(d);
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

const getDaysSince = (admissionDate) => {
  const diff = new Date() - new Date(admissionDate);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// ─── MedicineRow ─────────────────────────────────────────────────────────────
const MedicineRow = ({ med, index, onChange, onRemove }) => (
  <div className="grid gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 relative group">
    <div className="grid grid-cols-12 gap-2">
      {/* Medicine Name */}
      <div className="col-span-12 sm:col-span-4">
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Medicine Name *</label>
        <input
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
          placeholder="e.g., Paracetamol"
          value={med.name}
          onChange={e => onChange(index, 'name', e.target.value)}
        />
      </div>
      {/* Dose */}
      <div className="col-span-6 sm:col-span-2">
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Dose</label>
        <input
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
          placeholder="500mg"
          value={med.dose}
          onChange={e => onChange(index, 'dose', e.target.value)}
        />
      </div>
      {/* Route */}
      <div className="col-span-6 sm:col-span-2">
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Route</label>
        <select
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
          value={med.route}
          onChange={e => onChange(index, 'route', e.target.value)}
        >
          {['Oral', 'IV', 'IM', 'Topical', 'Subcutaneous', 'Inhalation', 'Sublingual', 'Other'].map(r => <option key={r}>{r}</option>)}
        </select>
      </div>
      {/* Frequency */}
      <div className="col-span-6 sm:col-span-2">
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Frequency</label>
        <select
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
          value={med.frequency}
          onChange={e => onChange(index, 'frequency', e.target.value)}
        >
          {['OD', 'BD', 'TDS', 'QID', 'SOS', 'Stat', 'ON', 'Weekly', 'Other'].map(f => <option key={f}>{f}</option>)}
        </select>
      </div>
      {/* Duration */}
      <div className="col-span-6 sm:col-span-2">
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Duration</label>
        <input
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
          placeholder="3 days"
          value={med.duration}
          onChange={e => onChange(index, 'duration', e.target.value)}
        />
      </div>
    </div>
    {/* Instructions */}
    <div>
      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Special Instructions</label>
      <input
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
        placeholder="e.g., After meals, with water"
        value={med.instructions}
        onChange={e => onChange(index, 'instructions', e.target.value)}
      />
    </div>
    {/* Remove Button */}
    <button
      onClick={() => onRemove(index)}
      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      title="Remove medicine"
    >
      <X size={12} />
    </button>
  </div>
);

// ─── AddRoundTab ─────────────────────────────────────────────────────────────
const AddRoundTab = ({ admission, onSuccess }) => {
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    roundType: 'Morning',
    chiefComplaints: '',
    clinicalNotes: '',
    diagnosis: '',
    medications: [],
    labText: '',
    followUpPlan: ''
  });

  const handleField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleMedChange = (index, key, val) => {
    setForm(f => {
      const meds = [...f.medications];
      meds[index] = { ...meds[index], [key]: val };
      return { ...f, medications: meds };
    });
  };

  const addMed = () => setForm(f => ({ ...f, medications: [...f.medications, { ...EMPTY_MED }] }));
  const removeMed = (i) => setForm(f => ({ ...f, medications: f.medications.filter((_, idx) => idx !== i) }));

  const handleSubmit = async () => {
    if (!form.chiefComplaints && !form.clinicalNotes && form.medications.length === 0) {
      addToast('warning', 'Kam se kam Chief Complaints ya ek dawa zaroor likhein');
      return;
    }
    const invalidMed = form.medications.find(m => !m.name.trim());
    if (invalidMed) {
      addToast('error', 'Har medicine ka naam required hai');
      return;
    }

    setSaving(true);
    try {
      const labOrders = form.labText
        ? form.labText.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      await api.post(`/api/v1/ward/admissions/${admission._id}/daily-rounds`, {
        roundType: form.roundType,
        chiefComplaints: form.chiefComplaints || undefined,
        clinicalNotes: form.clinicalNotes || undefined,
        diagnosis: form.diagnosis || undefined,
        medications: form.medications.length > 0 ? form.medications : undefined,
        labOrdersRequested: labOrders.length > 0 ? labOrders : undefined,
        followUpPlan: form.followUpPlan || undefined
      });

      addToast('success', 'Daily round successfully save ho gaya!');
      setForm({ roundType: 'Morning', chiefComplaints: '', clinicalNotes: '', diagnosis: '', medications: [], labText: '', followUpPlan: '' });
      onSuccess();
    } catch (err) {
      addToast('error', err?.response?.data?.message || 'Round save karne mein error aaya');
    } finally {
      setSaving(false);
    }
  };

  const cfg = ROUND_TYPE_CONFIG[form.roundType];

  return (
    <div className="space-y-5 p-1">
      {/* Round Type */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Round Type</label>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(ROUND_TYPE_CONFIG).map(([type, c]) => {
            const Icon = c.icon;
            const active = form.roundType === type;
            return (
              <button
                key={type}
                onClick={() => handleField('roundType', type)}
                className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                  active ? `${c.bg} ${c.border} ${c.color}` : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                <Icon size={18} />
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chief Complaints */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Chief Complaints <span className="text-slate-400 normal-case font-normal">(Aaj marij ko kya takleef hai)</span>
        </label>
        <textarea
          rows={2}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition resize-none"
          placeholder="e.g., Bukhar hai, sir dard, ulti aa rahi hai..."
          value={form.chiefComplaints}
          onChange={e => handleField('chiefComplaints', e.target.value)}
        />
      </div>

      {/* Clinical Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Clinical Notes / Observations
        </label>
        <textarea
          rows={3}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition resize-none"
          placeholder="Doctor ka observation: BP normal hai, chest clear, abdomen soft..."
          value={form.clinicalNotes}
          onChange={e => handleField('clinicalNotes', e.target.value)}
        />
      </div>

      {/* Diagnosis */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Diagnosis / Assessment Update
        </label>
        <input
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
          placeholder="e.g., Viral fever improving, Pneumonia resolving..."
          value={form.diagnosis}
          onChange={e => handleField('diagnosis', e.target.value)}
        />
      </div>

      {/* Medications Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Pill size={13} className="inline mr-1 text-indigo-400" />
            Medications Prescribed ({form.medications.length})
          </label>
          <button
            onClick={addMed}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition"
          >
            <Plus size={13} /> Add Medicine
          </button>
        </div>
        {form.medications.length === 0 ? (
          <div className="text-center py-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
            <Pill size={24} className="mx-auto mb-1.5 opacity-30" />
            Koi dawa nahi likhi — "Add Medicine" par click karein
          </div>
        ) : (
          <div className="space-y-2">
            {form.medications.map((med, i) => (
              <MedicineRow key={i} med={med} index={i} onChange={handleMedChange} onRemove={removeMed} />
            ))}
          </div>
        )}
      </div>

      {/* Lab Tests */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          <FlaskConical size={13} className="inline mr-1 text-emerald-400" />
          Lab Tests Requested <span className="text-slate-400 normal-case font-normal">(comma se alag karein)</span>
        </label>
        <input
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
          placeholder="e.g., CBC, LFT, Blood Sugar, Urine R/E"
          value={form.labText}
          onChange={e => handleField('labText', e.target.value)}
        />
      </div>

      {/* Follow-up Plan */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Follow-up Plan / Next Round Notes
        </label>
        <textarea
          rows={2}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition resize-none"
          placeholder="e.g., Kal subah repeat CBC. Agar fever nahi utri to antibiotic change karein..."
          value={form.followUpPlan}
          onChange={e => handleField('followUpPlan', e.target.value)}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          {saving ? 'Saving...' : 'Save Daily Round'}
        </button>
      </div>
    </div>
  );
};

// ─── RoundsHistoryTab ─────────────────────────────────────────────────────────
const RoundsHistoryTab = ({ rounds, loading }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <RefreshCw size={28} className="animate-spin text-indigo-400" />
        <p className="text-sm text-slate-500">Rounds load ho rahe hain...</p>
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
        <ClipboardList size={40} className="opacity-30" />
        <p className="text-sm font-medium">Abhi tak koi daily round nahi likha gaya</p>
        <p className="text-xs">"Add Round" tab se pehla round add karein</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-1">
      {rounds.map((round) => {
        const cfg = ROUND_TYPE_CONFIG[round.roundType] || ROUND_TYPE_CONFIG.Morning;
        const Icon = cfg.icon;
        const docName = round.doctor ? `Dr. ${round.doctor.firstName} ${round.doctor.lastName}` : 'Doctor';
        return (
          <div key={round._id} className={`rounded-2xl border-2 ${cfg.border} bg-white overflow-hidden shadow-sm`}>
            {/* Round Header */}
            <div className={`flex items-center justify-between px-4 py-3 ${cfg.bg}`}>
              <div className="flex items-center gap-2">
                <Icon size={18} className={cfg.color} />
                <span className={`font-bold text-sm ${cfg.color}`}>{round.roundType} Round</span>
                <span className="text-xs text-slate-500">• {docName}</span>
              </div>
              <span className="text-xs text-slate-500">{formatDateTime(round.roundDate)}</span>
            </div>

            {/* Round Body */}
            <div className="px-4 py-3 space-y-3">
              {round.chiefComplaints && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Chief Complaints</p>
                  <p className="text-sm text-slate-700">{round.chiefComplaints}</p>
                </div>
              )}
              {round.clinicalNotes && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Clinical Notes</p>
                  <p className="text-sm text-slate-700 whitespace-pre-line">{round.clinicalNotes}</p>
                </div>
              )}
              {round.diagnosis && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Diagnosis</p>
                  <p className="text-sm text-slate-700">{round.diagnosis}</p>
                </div>
              )}

              {/* Medications */}
              {round.medications && round.medications.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    <Pill size={11} className="inline mr-1" />Medications ({round.medications.length})
                  </p>
                  <div className="space-y-1">
                    {round.medications.map((med, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-1.5 text-xs bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5">
                        <span className="font-bold text-indigo-800">{med.name}</span>
                        {med.dose && <span className="text-indigo-600">{med.dose}</span>}
                        {med.route && <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">{med.route}</span>}
                        {med.frequency && <span className="bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">{med.frequency}</span>}
                        {med.duration && <span className="text-slate-500">for {med.duration}</span>}
                        {med.instructions && <span className="text-slate-400 italic">({med.instructions})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Tests */}
              {round.labOrdersRequested && round.labOrdersRequested.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    <FlaskConical size={11} className="inline mr-1" />Lab Tests Requested
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {round.labOrdersRequested.map((test, i) => (
                      <span key={i} className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full font-medium">{test}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up */}
              {round.followUpPlan && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-0.5">Follow-up Plan</p>
                  <p className="text-xs text-amber-800">{round.followUpPlan}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── PatientInfoTab ────────────────────────────────────────────────────────────
const PatientInfoTab = ({ admission }) => {
  const patientName = admission.patient?.name ||
    `${admission.patient?.firstName || ''} ${admission.patient?.lastName || ''}`.trim() || 'Unknown';
  const days = getDaysSince(admission.admissionDate);

  return (
    <div className="space-y-4 p-1">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-indigo-700">{days}</p>
          <p className="text-xs text-indigo-500 font-medium mt-0.5">Din Admitted</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-slate-700 truncate">{admission.ward?.wardName || 'N/A'}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Ward</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-slate-700">{admission.bedNumber || '—'}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Bed Number</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="space-y-3">
        <InfoRow icon={<User size={15} className="text-indigo-400" />} label="Patient Name" value={patientName} />
        <InfoRow icon={<Calendar size={15} className="text-indigo-400" />} label="Admission Date" value={formatDateTime(admission.admissionDate)} />
        <InfoRow icon={<Activity size={15} className="text-indigo-400" />} label="Status" value={getStatusBadge(admission.status)} />
        {admission.admissionRequest?.reasonForAdmission && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1">Admission Reason</p>
            <p className="text-sm text-blue-800">{admission.admissionRequest.reasonForAdmission}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-4 py-3">
    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
      {icon} {label}
    </div>
    <div className="text-sm font-medium text-slate-800">{value}</div>
  </div>
);

// ─── Patient Detail Modal ─────────────────────────────────────────────────────
const PatientModal = ({ admission, onClose }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [rounds, setRounds] = useState([]);
  const [roundsLoading, setRoundsLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const { addToast } = useToast();

  const patientName = admission.patient?.name ||
    `${admission.patient?.firstName || ''} ${admission.patient?.lastName || ''}`.trim() || 'Unknown';

  const fetchRounds = useCallback(async () => {
    setRoundsLoading(true);
    try {
      const res = await api.get(`/api/v1/ward/admissions/${admission._id}/daily-rounds`);
      setRounds(res.data.data || []);
    } catch {
      // silently fail
    } finally {
      setRoundsLoading(false);
    }
  }, [admission._id]);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  const handleRoundSuccess = () => {
    fetchRounds();
    setActiveTab('history');
  };

  const handleRequestDischarge = async () => {
    if (!window.confirm(`Kya aap "${patientName}" ki discharge request bhejna chahte hain?`)) return;
    setRequesting(true);
    try {
      await api.patch(`/api/v1/ward/admissions/${admission._id}/request-discharge`);
      addToast('success', 'Discharge request bhej di gayi — receptionist ko notification mila hai');
      onClose();
    } catch (err) {
      addToast('error', err?.response?.data?.message || 'Discharge request bhejne mein error');
    } finally {
      setRequesting(false);
    }
  };

  const TABS = [
    { id: 'info',    label: 'Patient Info', icon: User },
    { id: 'history', label: `Rounds (${rounds.length})`, icon: ClipboardList },
    { id: 'add',     label: 'Add Round',    icon: Plus },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-violet-600">
          <div>
            <h2 className="text-lg font-bold text-white">{patientName}</h2>
            <p className="text-indigo-200 text-xs mt-0.5">
              {admission.ward?.wardName || 'N/A'} • Bed {admission.bedNumber} • {getDaysSince(admission.admissionDate)} din se admit
            </p>
          </div>
          <div className="flex items-center gap-2">
            {admission.status === 'Admitted' && (
              <button
                onClick={handleRequestDischarge}
                disabled={requesting}
                className="flex items-center gap-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/30 px-3 py-1.5 rounded-lg transition disabled:opacity-60"
              >
                {requesting ? <RefreshCw size={13} className="animate-spin" /> : <LogOut size={13} />}
                Discharge Request
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-4 pt-2 gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-all ${
                activeTab === id
                  ? 'border-indigo-500 text-indigo-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'info' && <PatientInfoTab admission={admission} />}
          {activeTab === 'history' && <RoundsHistoryTab rounds={rounds} loading={roundsLoading} />}
          {activeTab === 'add' && <AddRoundTab admission={admission} onSuccess={handleRoundSuccess} />}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const DoctorAdmissions = () => {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const { addToast } = useToast();

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/ward/admissions');
      setAdmissions(res.data.data || []);
    } catch {
      addToast('error', 'Admitted patients load karne mein error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmissions(); }, []);

  const columns = [
    {
      header: 'Patient',
      key: 'patient',
      render: (row) => {
        const name = row.patient?.name || `${row.patient?.firstName || ''} ${row.patient?.lastName || ''}`.trim() || 'Unknown';
        const initial = name.charAt(0).toUpperCase();
        const days = getDaysSince(row.admissionDate);
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700 flex items-center justify-center font-black text-sm uppercase border border-indigo-200 shadow-sm flex-shrink-0">
              {initial}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{name}</div>
              <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock size={11} /> {days} din se admit
              </div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Ward / Bed',
      key: 'ward',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm">{row.ward?.wardName || 'N/A'}</div>
          <div className="text-xs text-slate-400">{row.ward?.wardType || 'General'} • Bed {row.bedNumber}</div>
        </div>
      )
    },
    {
      header: 'Admission Date',
      key: 'admissionDate',
      render: (row) => (
        <div className="text-sm text-slate-700 flex items-center gap-1.5">
          <Calendar size={13} className="text-slate-400 flex-shrink-0" />
          {new Date(row.admissionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => getStatusBadge(row.status)
    },
    {
      header: 'Actions',
      key: 'action',
      align: 'right',
      render: (row) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => { setSelectedAdmission({ ...row, _openTab: 'add' }); }}
            className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition shadow-sm"
          >
            <Plus size={13} /> Add Round
          </button>
          <button
            onClick={() => setSelectedAdmission(row)}
            className="flex items-center gap-1.5 text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition"
          >
            <FileText size={13} /> View
          </button>
        </div>
      )
    }
  ];

  // Stats
  const admitted = admissions.filter(a => a.status === 'Admitted').length;
  const dischargeRequested = admissions.filter(a => a.status === 'Discharge Requested').length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">IPD Admissions</h1>
          <p className="text-sm text-slate-500 mt-1">Apne admitted patients ke daily rounds manage karein</p>
        </div>
        <button
          onClick={fetchAdmissions}
          className="flex items-center gap-2 text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl transition"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bed size={22} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-indigo-700">{admissions.length}</p>
            <p className="text-xs text-indigo-500 font-semibold">Total Patients</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Activity size={22} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-700">{admitted}</p>
            <p className="text-xs text-emerald-500 font-semibold">Currently Admitted</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <LogOut size={22} className="text-amber-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-amber-700">{dischargeRequested}</p>
            <p className="text-xs text-amber-500 font-semibold">Discharge Pending</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Stethoscope size={16} className="text-indigo-500" /> Admitted Patients List
          </h2>
        </div>
        <div className="min-h-[300px]">
          <DataTable
            columns={columns}
            data={admissions}
            loading={loading}
            emptyIcon={Bed}
            emptyTitle="Koi admitted patient nahi mila"
          />
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedAdmission && (
        <PatientModal
          admission={selectedAdmission}
          onClose={() => { setSelectedAdmission(null); fetchAdmissions(); }}
        />
      )}
    </div>
  );
};

export default DoctorAdmissions;
