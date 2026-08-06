import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, Clock, Calendar, Plus, X, Save, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DoctorSchedules = () => {
  const { showToast } = useToast();
  
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // Schedule state format: { Monday: [{start: '09:00', end: '13:00'}], ... }
  const [schedule, setSchedule] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Form states per day for adding a slot
  const [addingSlotDay, setAddingSlotDay] = useState(null); // 'Monday', etc.
  const [slotForm, setSlotForm] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/v1/doctors');
      setDoctors(res.data?.doctors || res.data?.data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load doctors', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert doctor's availabilitySchedule array into our working object
  const loadDoctorSchedule = (doc) => {
    setSelectedDoctor(doc);
    const newSchedule = {};
    DAYS.forEach(day => newSchedule[day] = []);
    
    if (doc.availabilitySchedule && Array.isArray(doc.availabilitySchedule)) {
      doc.availabilitySchedule.forEach(slot => {
        if (newSchedule[slot.day]) {
          newSchedule[slot.day].push({ start: slot.startTime, end: slot.endTime });
        }
      });
    }
    
    // Sort slots by start time
    DAYS.forEach(day => {
      newSchedule[day].sort((a, b) => a.start.localeCompare(b.start));
    });
    
    setSchedule(newSchedule);
    setAddingSlotDay(null);
    setSlotForm({ start: '', end: '' });
  };

  const filteredDoctors = useMemo(() => {
    if (!searchQuery) return doctors;
    const lowerQ = searchQuery.toLowerCase();
    return doctors.filter(doc => 
      doc.name?.toLowerCase().includes(lowerQ) ||
      doc.user?.firstName?.toLowerCase().includes(lowerQ) ||
      doc.user?.lastName?.toLowerCase().includes(lowerQ) ||
      doc.firstName?.toLowerCase().includes(lowerQ) || 
      doc.lastName?.toLowerCase().includes(lowerQ) ||
      doc.specialization?.toLowerCase().includes(lowerQ)
    );
  }, [doctors, searchQuery]);

  const handleAddSlot = (day) => {
    const { start, end } = slotForm;
    
    if (!start || !end) {
      showToast('Start and end time required', 'error');
      return;
    }
    if (start >= end) {
      showToast('End time must be after start time', 'error');
      return;
    }

    // Check overlaps
    const daySlots = schedule[day] || [];
    const hasOverlap = daySlots.some(s => {
      // Overlap condition: (StartA < EndB) and (EndA > StartB)
      return start < s.end && end > s.start;
    });

    if (hasOverlap) {
      showToast('Slot overlaps with existing schedule', 'error');
      return;
    }

    setSchedule(prev => {
      const updated = { ...prev };
      updated[day] = [...(updated[day] || []), { start, end }].sort((a, b) => a.start.localeCompare(b.start));
      return updated;
    });

    setAddingSlotDay(null);
    setSlotForm({ start: '', end: '' });
  };

  const handleRemoveSlot = (day, index) => {
    setSchedule(prev => {
      const updated = { ...prev };
      updated[day] = [...updated[day]];
      updated[day].splice(index, 1);
      return updated;
    });
  };

  const handleSaveSchedule = async () => {
    if (!selectedDoctor) return;
    
    setIsSaving(true);
    
    // Convert back to API array format
    const availabilitySchedule = [];
    Object.keys(schedule).forEach(day => {
      schedule[day].forEach(slot => {
        availabilitySchedule.push({
          day: day,
          startTime: slot.start,
          endTime: slot.end
        });
      });
    });

    try {
      await api.patch(`/api/v1/doctors/${selectedDoctor._id}/schedule`, { availabilitySchedule });
      showToast(`Schedule updated for Dr. ${selectedDoctor.name || selectedDoctor.lastName || ''}`, 'success');
      
      // Update local doctors array with new schedule so we don't have to refetch
      setDoctors(prev => prev.map(d => d._id === selectedDoctor._id ? { ...d, availabilitySchedule } : d));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save schedule', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Doctor Schedules</h1>
          <p className="text-sm text-slate-500 mt-1">Manage weekly availability and consulting hours for doctors.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Left Panel: Doctor List */}
        <div className="w-full lg:w-80 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search doctors..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoading ? (
              <div className="p-4 space-y-4">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No doctors found.
              </div>
            ) : (
              filteredDoctors.map(doc => (
                <button
                  key={doc._id}
                  onClick={() => loadDoctorSchedule(doc)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    selectedDoctor?._id === doc._id 
                      ? 'bg-indigo-50 border border-indigo-100 shadow-sm' 
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {doc.profilePicture ? (
                      <img src={doc.profilePicture} alt="Doctor" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${selectedDoctor?._id === doc._id ? 'text-indigo-900' : 'text-slate-900'}`}>
                      Dr. {doc.name || `${doc.user?.firstName || doc.firstName || ''} ${doc.user?.lastName || doc.lastName || ''}`}
                    </p>
                    <p className={`text-xs truncate ${selectedDoctor?._id === doc._id ? 'text-indigo-600' : 'text-slate-500'}`}>
                      {doc.specialization || 'General'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Schedule Editor */}
        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-0">
          {!selectedDoctor ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState 
                icon={Calendar} 
                title="Select a Doctor" 
                description="Choose a doctor from the list to view and manage their schedule."
                className="border-none bg-transparent"
              />
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden">
                    {selectedDoctor.profilePicture ? (
                      <img src={selectedDoctor.profilePicture} alt="Doctor" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Dr. {selectedDoctor.name || `${selectedDoctor.user?.firstName || selectedDoctor.firstName || ''} ${selectedDoctor.user?.lastName || selectedDoctor.lastName || ''}`}</h2>
                    <p className="text-sm text-slate-500">{selectedDoctor.specialization || 'General Practitioner'}</p>
                  </div>
                </div>
                <Button onClick={handleSaveSchedule} isLoading={isSaving} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Schedule
                </Button>
              </div>

              <div className="flex-1 overflow-x-auto overflow-y-auto p-6 bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4 min-w-[1200px]">
                  {DAYS.map(day => (
                    <div key={day} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                      <div className="p-3 border-b border-slate-100 bg-slate-50/80 rounded-t-xl">
                        <h3 className="font-semibold text-slate-800 text-sm">{day}</h3>
                      </div>
                      
                      <div className="p-3 flex-1 flex flex-col gap-2">
                        {schedule[day]?.length === 0 ? (
                          <div className="text-xs text-slate-400 text-center py-4 flex flex-col items-center gap-1">
                            <Clock className="w-4 h-4 mb-1 opacity-50" />
                            No slots set — closed
                          </div>
                        ) : (
                          schedule[day]?.map((slot, idx) => (
                            <div key={idx} className="group relative flex items-center justify-between bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium">
                              <span>{slot.start} - {slot.end}</span>
                              <button 
                                onClick={() => handleRemoveSlot(day, idx)}
                                className="text-indigo-400 hover:text-red-500 hover:bg-white rounded p-0.5 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}

                        {/* Add Slot Form or Button */}
                        {addingSlotDay === day ? (
                          <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                            <div className="flex flex-col gap-2 mb-3">
                              <div className="w-full">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Start</label>
                                <input 
                                  type="time" 
                                  value={slotForm.start}
                                  onChange={e => setSlotForm(prev => ({ ...prev, start: e.target.value }))}
                                  className="w-full text-xs p-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" 
                                />
                              </div>
                              <div className="w-full">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">End</label>
                                <input 
                                  type="time" 
                                  value={slotForm.end}
                                  onChange={e => setSlotForm(prev => ({ ...prev, end: e.target.value }))}
                                  className="w-full text-xs p-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" 
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button 
                                type="button" 
                                size="sm" 
                                className="w-full py-1.5 h-auto text-xs" 
                                onClick={() => handleAddSlot(day)}
                              >
                                Add
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="w-full py-1 h-auto text-xs" 
                                onClick={() => { setAddingSlotDay(null); setSlotForm({ start: '', end: '' }); }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setAddingSlotDay(day);
                              setSlotForm({ start: '09:00', end: '13:00' }); // defaults
                            }}
                            className="mt-2 w-full py-2 border border-dashed border-slate-300 rounded-lg text-xs font-medium text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Slot
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorSchedules;
