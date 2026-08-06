import React, { useState } from 'react';
import { X, Activity } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

const RecordVitalsModal = ({ admission, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    notes: ''
  });

  const getSpO2Color = (val) => {
    if (!val) return '';
    const num = Number(val);
    if (num < 92) return 'text-red-600 border-red-300 focus:border-red-500 focus:ring-red-500/20';
    if (num < 95) return 'text-amber-600 border-amber-300 focus:border-amber-500 focus:ring-amber-500/20';
    return 'text-emerald-600 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20';
  };

  const getHRColor = (val) => {
    if (!val) return '';
    const num = Number(val);
    if (num < 50 || num > 120) return 'text-red-600 border-red-300 focus:border-red-500 focus:ring-red-500/20';
    if (num < 60 || num > 100) return 'text-amber-600 border-amber-300 focus:border-amber-500 focus:ring-amber-500/20';
    return 'text-emerald-600 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/v1/ward/vitals', {
        allocation: admission._id,
        patient: admission.patient?._id,
        ...form,
        heartRate: Number(form.heartRate),
        temperature: Number(form.temperature),
        respiratoryRate: Number(form.respiratoryRate),
        oxygenSaturation: Number(form.oxygenSaturation)
      });
      showToast('Vitals recorded successfully', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to record vitals', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900">
            <Activity className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold">Record Vitals</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-indigo-50/50 p-3 rounded-lg mb-4">
            <p className="text-sm font-medium text-indigo-900">Patient: {admission.patient?.name}</p>
            <p className="text-xs text-indigo-700">Bed: {admission.bedNumber} • Ward: {admission.ward?.wardName}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Blood Pressure (mmHg)</label>
              <Input 
                value={form.bloodPressure} 
                onChange={e => setForm({...form, bloodPressure: e.target.value})} 
                placeholder="e.g. 120/80" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Heart Rate (bpm)</label>
              <Input 
                type="number"
                value={form.heartRate} 
                onChange={e => setForm({...form, heartRate: e.target.value})} 
                placeholder="60-100" 
                className={getHRColor(form.heartRate)}
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SpO2 (%)</label>
              <Input 
                type="number"
                value={form.oxygenSaturation} 
                onChange={e => setForm({...form, oxygenSaturation: e.target.value})} 
                placeholder="95-100" 
                className={getSpO2Color(form.oxygenSaturation)}
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Temp (°C)</label>
              <Input 
                type="number"
                step="0.1"
                value={form.temperature} 
                onChange={e => setForm({...form, temperature: e.target.value})} 
                placeholder="36.5-37.5" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Resp. Rate (/min)</label>
              <Input 
                type="number"
                value={form.respiratoryRate} 
                onChange={e => setForm({...form, respiratoryRate: e.target.value})} 
                placeholder="12-20" 
                required 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
            <textarea
              className="w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm px-4 py-2.5"
              rows={2}
              value={form.notes}
              onChange={e => setForm({...form, notes: e.target.value})}
              placeholder="Any additional observations..."
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Vitals'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordVitalsModal;
