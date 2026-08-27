import React, { useState, useEffect } from 'react';
import { User, Clock, Briefcase, Plus, X, IndianRupee } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const DoctorProfile = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    specialization: '',
    consultationFee: '',
    experience: '',
    qualifications: [''],
    availabilitySchedule: [
      { day: 'Monday', startTime: '09:00', endTime: '17:00' }
    ]
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Optional: In a real app, fetch existing profile data here. 
  // We'll initialize with basic user data if available.

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        consultationFee: Number(formData.consultationFee),
        experience: Number(formData.experience)
      };
      await api.put('/api/v1/doctors/profile', payload);
      addToast('success', 'Profile updated successfully');
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleQualificationChange = (index, value) => {
    const updated = [...formData.qualifications];
    updated[index] = value;
    setFormData({ ...formData, qualifications: updated });
  };

  const addQualification = () => {
    setFormData({ ...formData, qualifications: [...formData.qualifications, ''] });
  };

  const removeQualification = (index) => {
    const updated = [...formData.qualifications];
    updated.splice(index, 1);
    setFormData({ ...formData, qualifications: updated });
  };

  const handleScheduleChange = (index, field, value) => {
    const updated = [...formData.availabilitySchedule];
    updated[index][field] = value;
    setFormData({ ...formData, availabilitySchedule: updated });
  };

  const addSchedule = () => {
    setFormData({ 
      ...formData, 
      availabilitySchedule: [...formData.availabilitySchedule, { day: 'Monday', startTime: '09:00', endTime: '17:00' }] 
    });
  };

  const removeSchedule = (index) => {
    const updated = [...formData.availabilitySchedule];
    updated.splice(index, 1);
    setFormData({ ...formData, availabilitySchedule: updated });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your professional details and availability.</p>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <User className="text-indigo-600" /> Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Specialization</label>
              <input 
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Cardiologist"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Experience (Years)</label>
              <input 
                type="number" min="0"
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. 10"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Consultation Fee</label>
              <div className="relative">
                <IndianRupee size={16} className="absolute left-3 top-3 text-slate-400" />
                <input 
                  type="number" min="0"
                  value={formData.consultationFee}
                  onChange={(e) => setFormData({...formData, consultationFee: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2.5 pl-9 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. 500"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Briefcase className="text-indigo-600" /> Qualifications
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={addQualification}>
              <Plus size={16} className="mr-1" /> Add
            </Button>
          </div>
          
          <div className="space-y-3">
            {formData.qualifications.map((qual, index) => (
              <div key={index} className="flex items-center gap-3">
                <input 
                  type="text"
                  value={qual}
                  onChange={(e) => handleQualificationChange(index, e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. MBBS, MD - Cardiology"
                />
                {formData.qualifications.length > 1 && (
                  <button type="button" onClick={() => removeQualification(index)} className="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-lg transition-colors">
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="text-indigo-600" /> Availability Schedule
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={addSchedule}>
              <Plus size={16} className="mr-1" /> Add Slot
            </Button>
          </div>
          
          <div className="space-y-4">
            {formData.availabilitySchedule.map((slot, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-slate-500">Day</label>
                  <select 
                    value={slot.day}
                    onChange={(e) => handleScheduleChange(index, 'day', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-indigo-500 bg-white"
                  >
                    {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-slate-500">Start Time</label>
                  <input 
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-slate-500">End Time</label>
                  <input 
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                {formData.availabilitySchedule.length > 1 && (
                  <div className="pt-5 flex justify-end">
                    <button type="button" onClick={() => removeSchedule(index)} className="text-red-500 hover:text-red-700 p-2 bg-red-100 rounded-lg transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end pt-4">
          <Button type="submit" loading={loading} className="px-8">
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DoctorProfile;
