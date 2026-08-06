import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, Edit2, Ban, Trash2, CheckCircle2, User, Stethoscope, BriefcaseMedical, FlaskConical, Award, Calendar, CheckCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';

const StaffDetailDrawer = ({ staff, onClose, onToggleStatus, onDelete }) => {
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [loadingDoctor, setLoadingDoctor] = useState(false);

  useEffect(() => {
    if (staff && staff.role === 'doctor') {
      const fetchDoctor = async () => {
        setLoadingDoctor(true);
        try {
          const res = await api.get(`/api/v1/doctors?userId=${staff._id}`);
          if (res.data.doctors && res.data.doctors.length > 0) {
            setDoctorDetails(res.data.doctors[0]);
          }
        } catch (error) {
          console.error("Failed to fetch doctor details", error);
        } finally {
          setLoadingDoctor(false);
        }
      };
      fetchDoctor();
    } else {
      setDoctorDetails(null);
    }
  }, [staff]);

  if (!staff) return null;

  const getRoleIcon = (role) => {
    switch (role) {
      case 'doctor': return <Stethoscope size={20} className="text-indigo-500" />;
      case 'receptionist': return <BriefcaseMedical size={20} className="text-teal-500" />;
      case 'pharmacist':
      case 'lab_technician': return <FlaskConical size={20} className="text-purple-500" />;
      default: return <User size={20} className="text-slate-500" />;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'doctor': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'receptionist': return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'pharmacist': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'lab_technician': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 sm:py-12">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl w-full sm:w-11/12 md:max-w-2xl max-h-full overflow-y-auto flex flex-col relative animate-scale-in z-10">
        
        {/* Header Background */}
        <div className="h-24 sm:h-28 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 shrink-0 relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-sm transition-colors z-10 focus:outline-none">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex-1">
          {/* Profile Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-12 sm:-mt-14 mb-6 sm:mb-8 relative z-10">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
              {staff.profilePicture ? (
                <img src={staff.profilePicture} alt={staff.firstName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl sm:text-4xl text-slate-400 font-bold uppercase">{staff.firstName.charAt(0)}{staff.lastName?.charAt(0)}</span>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left mb-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {staff.role === 'doctor' ? 'Dr. ' : ''}{staff.firstName} {staff.lastName}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize flex items-center gap-1.5 border ${getRoleBadge(staff.role)}`}>
                  {getRoleIcon(staff.role)}
                  {staff.role.replace('_', ' ')}
                </span>
                <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${staff.isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                  {staff.isApproved ? <CheckCircle size={12} /> : <Ban size={12} />}
                  {staff.isApproved ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Details Sections using flex layout for better flexibility */}
          <div className="flex flex-col md:flex-row gap-5 md:gap-6">
            
            {/* Left Column */}
            <div className="flex-1 flex flex-col gap-5">
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 shadow-sm flex-1">
                <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                      <Mail size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Email</span>
                      <a href={`mailto:${staff.email}`} className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors truncate block">{staff.email}</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                      <Phone size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Phone</span>
                      <a href={`tel:${staff.mobile}`} className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors truncate block">{staff.mobile}</a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 shadow-sm">
                <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">System Info</h4>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm shrink-0">
                    <Calendar size={14} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Date Added</span>
                    <span className="text-sm font-medium text-slate-700">{new Date(staff.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            {(staff.role === 'doctor' || staff.specialization || staff.qualifications || staff.experience || doctorDetails) && (
              <div className="flex-1 flex flex-col gap-5">
                {(staff.role === 'doctor' || staff.specialization || staff.qualifications || staff.experience) && (
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 shadow-sm flex-1">
                  <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Professional Details</h4>
                  <div className="space-y-3">
                    {(staff.specialization || (doctorDetails && doctorDetails.specialization)) && (
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                          <Stethoscope size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Specialization</span>
                          <span className="text-sm font-medium text-slate-700 capitalize truncate block">{staff.specialization || doctorDetails.specialization}</span>
                        </div>
                      </div>
                    )}
                    {staff.qualifications && (
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                          <Award size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Qualifications</span>
                          <span className="text-sm font-medium text-slate-700 truncate block">{staff.qualifications}</span>
                        </div>
                      </div>
                    )}
                    {staff.experience && (
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                          <BriefcaseMedical size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Experience</span>
                          <span className="text-sm font-medium text-slate-700 truncate block">{staff.experience} Years</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {doctorDetails && (
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 shadow-sm">
                  <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Scheduling</h4>
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                      <Clock size={14} />
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Consultation Duration</span>
                      <span className="text-sm font-medium text-slate-700">{doctorDetails.consultationDuration} Mins</span>
                    </div>
                  </div>
                  
                  {doctorDetails.availabilitySchedule && doctorDetails.availabilitySchedule.length > 0 && (
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Weekly Schedule</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {doctorDetails.availabilitySchedule.map((schedule, idx) => (
                          <div key={idx} className="bg-white p-1.5 rounded border border-slate-200 flex flex-col items-center justify-center text-center shadow-sm">
                            <span className="text-[10px] font-bold text-indigo-600">{schedule.day.substring(0,3).toUpperCase()}</span>
                            <span className="text-[10px] text-slate-500 mt-0.5">{schedule.startTime}-{schedule.endTime}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1 justify-center gap-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
              <Edit2 size={16} /> Edit
            </Button>
            <Button 
              variant="outline" 
              className={`flex-1 justify-center gap-2 text-sm font-semibold shadow-sm ${staff.isApproved ? 'text-amber-600 hover:bg-amber-50 hover:border-amber-200' : 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'}`}
              onClick={onToggleStatus}
            >
              {staff.isApproved ? <><Ban size={16} /> Suspend</> : <><CheckCircle2 size={16} /> Activate</>}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 justify-center gap-2 text-sm font-semibold shadow-sm border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={onDelete}
            >
              <Trash2 size={16} /> Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDetailDrawer;
