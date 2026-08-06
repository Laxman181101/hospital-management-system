import React, { useState } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import Badge from '../../../components/ui/Badge';

const TransferModal = ({ admission, wards, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    ward: '',
    bedNumber: '',
    reason: ''
  });

  const handleTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Discharge from current bed (isTransfer=true skips billing)
      await api.patch(`/api/v1/ward/admissions/${admission._id}/discharge`, {
        dischargeNotes: `Internal transfer. Reason: ${form.reason}`,
        isTransfer: true
      });

      // 2. Admit to new bed
      await api.post('/api/v1/ward/admissions', {
        patient: admission.patient?._id,
        ward: form.ward,
        bedNumber: form.bedNumber,
        primaryDoctor: admission.primaryDoctor?._id,
        primaryNurse: admission.primaryNurse?._id
      });

      showToast('Patient transferred successfully', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to complete transfer process', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900">
            <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold">Transfer Bed</h3>
            <Badge variant="warning" className="ml-2 text-[10px] uppercase">Beta</Badge>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleTransfer} className="p-6 space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
            <p className="text-sm font-medium text-slate-900 mb-1">{admission.patient?.name}</p>
            <p className="text-xs text-slate-500">Current: {admission.ward?.wardName} - Bed {admission.bedNumber}</p>
          </div>

          <p className="text-xs text-slate-500 italic bg-indigo-50/50 p-2 rounded-lg">
            Note: Transfer (Discharge + Re-admit) workflow will be executed.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Ward *</label>
            <select 
              value={form.ward} 
              onChange={e => setForm({...form, ward: e.target.value})} 
              className="w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm px-4 py-2.5" 
              required
            >
              <option value="">-- Choose Ward --</option>
              {wards.filter(w => w._id !== admission.ward?._id || true).map(w => (
                <option key={w._id} value={w._id}>
                  {w.wardName} ({w.availableBeds ?? 0} free)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Bed Number *</label>
            <Input 
              value={form.bedNumber} 
              onChange={e => setForm({...form, bedNumber: e.target.value})} 
              placeholder="e.g. B-12" 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Transfer</label>
            <Input 
              value={form.reason} 
              onChange={e => setForm({...form, reason: e.target.value})} 
              placeholder="e.g. Stepping down from ICU" 
              required 
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Processing...' : 'Transfer Patient'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferModal;
