import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Search, ChevronRight, CheckCircle2, User, Sun, Cloud, Moon, CalendarOff, Video, MessageSquare, Phone, Building2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';

const BookAppointment = () => {
  const [step, setStep] = useState(1);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointmentType, setAppointmentType] = useState('physical');
  const [reason, setReason] = useState('');
  
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    // Fetch hospitals on mount
    const fetchHospitals = async () => {
      try {
        const res = await api.get('/api/v1/hospitals');
        setHospitals(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch hospitals');
      }
    };
    fetchHospitals();
  }, []);

  useEffect(() => {
    if (selectedHospital) {
      // Fetch doctors for this hospital
      const fetchDoctors = async () => {
        try {
          const res = await api.get(`/api/v1/doctors?hospitalId=${selectedHospital._id}`);
          setDoctors(res.data.doctors || res.data.data || []);
        } catch (err) {
          console.error('Failed to fetch doctors');
        }
      };
      fetchDoctors();
    }
  }, [selectedHospital]);

  // Generate slots based on doctor's schedule for the selected date
  const generateSlots = () => {
    if (!selectedDoctor || !selectedDate) return [];
    
    const dateObj = new Date(selectedDate);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[dateObj.getDay()];
    
    const scheduleForDay = selectedDoctor.availabilitySchedule?.filter(s => s.day === dayName) || [];
    
    if (scheduleForDay.length === 0) return [];
    
    const slots = [];
    
    scheduleForDay.forEach(block => {
      // Very basic 30 min interval generator for the block
      let current = block.startTime;
      while (current < block.endTime) {
        // Parse time to add 30 mins
        const [h, m] = current.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m, 0);
        date.setMinutes(date.getMinutes() + 30);
        
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
  
  const [slots, setSlots] = useState([]);
  useEffect(() => {
    if (selectedDate && selectedDoctor) {
      setSlots(generateSlots());
      setSelectedSlot(null);
    }
  }, [selectedDate, selectedDoctor]);

  const handleBook = async () => {
    let date = selectedDate;
    let slot = selectedSlot;
    
    if (appointmentType === 'chat') {
      const now = new Date();
      date = now.toISOString().split('T')[0];
      
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const modifier = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const startTime = `${String(hours).padStart(2, '0')}:${minutes} ${modifier}`;
      
      now.setMinutes(now.getMinutes() + 15);
      hours = now.getHours();
      const endMinutes = String(now.getMinutes()).padStart(2, '0');
      const endModifier = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const endTime = `${String(hours).padStart(2, '0')}:${endMinutes} ${endModifier}`;
      
      slot = { startTime, endTime };
    }

    if (!selectedHospital || !selectedDoctor || !date || !slot) {
      return addToast('error', 'Please fill all fields');
    }
    try {
      setLoading(true);
      await api.post('/api/v1/appointments', {
        hospital: selectedHospital._id,
        doctor: selectedDoctor._id,
        appointmentDate: date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        appointmentType,
        bookingMode: 'online',
        reason: reason || 'General checkup'
      });
      addToast('success', 'Appointment booked successfully!');
      setStep(4);
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const [hospitalSearch, setHospitalSearch] = useState('');

  const filteredHospitals = hospitals.filter(h => {
    const name = (h.hospitalName || h.name || '').toLowerCase();
    const city = (h.address?.city || h.city || '').toLowerCase();
    const street = (h.address?.street || '').toLowerCase();
    const q = hospitalSearch.toLowerCase().trim();
    return name.includes(q) || city.includes(q) || street.includes(q);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Book Appointment</h1>
        <p className="text-slate-500 text-sm mt-1">Schedule a new visit with your preferred doctor.</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-10"></div>
        {[
          { num: 1, label: 'Hospital' },
          { num: 2, label: 'Doctor' },
          { num: 3, label: 'Date & Time' },
          { num: 4, label: 'Done' }
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center gap-2 bg-slate-50 px-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s.num ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-200 text-slate-500'}`}>
              {step > s.num ? <CheckCircle2 size={16} /> : s.num}
            </div>
            <span className={`text-xs font-medium ${step >= s.num ? 'text-slate-900' : 'text-slate-500'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Select a Hospital</h2>
                <p className="text-xs text-slate-500">Choose from verified & approved partner hospitals</p>
              </div>
              <div className="relative sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search hospital or city..."
                  value={hospitalSearch}
                  onChange={(e) => setHospitalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {filteredHospitals.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Building2 size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">No hospitals found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredHospitals.map(h => {
                  const hName = h.hospitalName || h.name || 'Hospital';
                  const hCity = h.address?.city || h.city || '';
                  const hStreet = h.address?.street || '';
                  const isSelected = selectedHospital?._id === h._id;

                  return (
                    <div 
                      key={h._id}
                      onClick={() => { setSelectedHospital(h); setStep(2); }}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-500/20' 
                          : 'border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50/80 hover:shadow-sm'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 font-bold">
                        {h.logoUrl ? (
                          <img src={h.logoUrl} alt={hName} className="w-full h-full object-contain p-1 rounded-xl" />
                        ) : (
                          <Building2 size={24} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 text-base leading-snug truncate mb-1">{hName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1.5">
                          <MapPin size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">{hStreet ? `${hStreet}, ` : ''}{hCity || 'Location not specified'}</span>
                        </div>
                        {h.phone && (
                          <div className="text-xs text-slate-500 flex items-center gap-1.5">
                            <Phone size={12} className="text-slate-400 shrink-0" />
                            <span>{h.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="self-center">
                        <ChevronRight size={18} className="text-slate-300" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <button onClick={() => setStep(1)} className="text-sm text-indigo-600 hover:underline mb-4">&larr; Back to Hospitals</button>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Select a Doctor</h2>
            {doctors.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No doctors available at this hospital.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors.map(d => (
                  <div 
                    key={d._id}
                    onClick={() => { setSelectedDoctor(d); setStep(3); }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedDoctor?._id === d._id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}
                  >
                    <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                       {d.profilePicture ? <img src={d.profilePicture} alt="doc" className="w-full h-full object-cover" /> : <User className="text-slate-500 w-8 h-8" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 text-lg">Dr. {d.name || d.user?.firstName + ' ' + d.user?.lastName}</div>
                      <div className="text-sm font-medium text-indigo-600 mb-1">{d.specialization || 'General Practitioner'}</div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                        {d.experience ? (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-slate-700">{d.experience}</span> Years Exp.
                          </div>
                        ) : null}
                        {d.qualifications && d.qualifications.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className="truncate max-w-[150px]">{d.qualifications.join(', ')}</span>
                          </div>
                        ) : null}
                        <div className="flex items-center gap-1 text-emerald-600 font-medium">
                          ₹{d.consultationFee}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <button onClick={() => setStep(2)} className="text-sm text-indigo-600 hover:underline">&larr; Back to Doctors</button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={appointmentType === 'chat' ? 'md:col-span-2 max-w-xl' : ''}>
                {appointmentType !== 'chat' && (
                  <>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
                    <input 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </>
                )}
                
                <input 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                
                <label className="block text-sm font-medium text-slate-700 mt-6 mb-2">Consultation Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'physical', label: 'In-Clinic / Walk-in', icon: Building2, desc: 'Visit hospital in person' },
                    { id: 'video', label: 'Video Consultation', icon: Video, desc: 'HD Live Video Call' },
                    { id: 'chat', label: 'Chat Consultation', icon: MessageSquare, desc: 'Instant Live Messaging' },
                    { id: 'audio', label: 'Audio Consultation', icon: Phone, desc: 'Voice Teleconsultation' }
                  ].map(({ id, label, icon: Icon, desc }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAppointmentType(id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        appointmentType === id 
                          ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={16} className={appointmentType === id ? 'text-indigo-600' : 'text-slate-500'} />
                        <span className="font-semibold text-xs text-slate-900">{label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{desc}</p>
                    </button>
                  ))}
                </div>

                <label className="block text-sm font-medium text-slate-700 mt-6 mb-2">Reason for Visit (Optional)</label>
                <textarea 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="E.g., Follow-up, Routine checkup"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-24"
                />
              </div>

              {appointmentType !== 'chat' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Available Slots</label>
                {!selectedDate ? (
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-sm">
                    Please select a date first
                  </div>
                ) : (
                  <div className="space-y-5 max-h-96 overflow-y-auto pr-2">
                    {slots.length === 0 ? (
                      <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-500 bg-slate-50/50 p-6 text-center">
                        <CalendarOff className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="font-medium">No slots available</p>
                        <p className="text-sm mt-1">The doctor is not available on this date. Please select a different date.</p>
                      </div>
                    ) : (
                      (() => {
                        const morning = slots.filter(s => parseInt(s.startTime.split(':')[0]) < 12);
                        const afternoon = slots.filter(s => {
                          const h = parseInt(s.startTime.split(':')[0]);
                          return h >= 12 && h < 17;
                        });
                        const evening = slots.filter(s => parseInt(s.startTime.split(':')[0]) >= 17);

                        const renderGroup = (title, groupSlots, icon) => {
                          if (groupSlots.length === 0) return null;
                          return (
                            <div>
                              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {icon} {title}
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {groupSlots.map((slot, idx) => (
                                  <button
                                    key={idx}
                                    disabled={!slot.available}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`p-2.5 text-sm font-semibold rounded-xl border transition-all duration-300 ${
                                      !slot.available ? 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed opacity-60' :
                                      selectedSlot?.startTime === slot.startTime ? 'bg-indigo-600 border-indigo-600 text-white shadow-[0_4px_12px_rgb(79,70,229,0.3)] transform scale-105' :
                                      'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:-translate-y-0.5'
                                    }`}
                                  >
                                    {slot.startTime}
                                  </button>
                                ))}
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
                      })()
                    )}
                  </div>
                )}
              </div>
            )}
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-100">
              <Button onClick={handleBook} isLoading={loading} disabled={appointmentType !== 'chat' && (!selectedDate || !selectedSlot)}>
                Confirm Booking
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="py-12 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Booking Confirmed!</h2>
            <p className="text-slate-500 max-w-md">Your appointment has been successfully scheduled. You can view and manage your booking in the Appointments section.</p>
            <div className="pt-6">
              <Button variant="outline" onClick={() => window.location.href='/patient/appointments'}>
                View My Appointments
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;
