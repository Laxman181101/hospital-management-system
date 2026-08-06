import React from 'react';
import { X, User, Calendar, Clock, Award, PhoneCall, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const DoctorProfileModal = ({ isOpen, onClose, doctor }) => {
  if (!isOpen || !doctor) return null;

  const getDayAvailability = (day) => {
    return doctor.availabilitySchedule?.find(s => s.day === day);
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">Doctor Profile</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 flex-1">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Col: Image & Basic Info */}
            <div className="flex flex-col items-center text-center md:w-1/3">
              <div className="w-32 h-32 rounded-full border-4 border-indigo-50 shadow-md overflow-hidden mb-4 bg-slate-100">
                {doctor.profilePicture ? (
                  <img src={doctor.profilePicture} alt={doctor.name || doctor.firstName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-500 font-bold text-4xl">
                    {(doctor.name || doctor.user?.firstName || doctor.firstName || 'D').charAt(0)}
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">
                Dr. {doctor.name || `${doctor.user?.firstName || doctor.firstName || ''} ${doctor.user?.lastName || doctor.lastName || ''}`}
              </h3>
              <p className="text-indigo-600 font-medium mb-3">{doctor.specialization || 'General Physician'}</p>
              
              <div className="flex flex-wrap gap-2 justify-center">
                {doctor.consultationModes?.map(mode => (
                  <span key={mode} className="px-2 py-1 text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md capitalize">
                    {mode}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Col: Details */}
            <div className="md:w-2/3 space-y-6">
              
              {/* Experience & Fee */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Award size={16} />
                    <span className="text-sm font-medium">Experience</span>
                  </div>
                  <p className="font-bold text-slate-800">{doctor.experience || 0} Years</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <CheckCircle size={16} />
                    <span className="text-sm font-medium">Consultation Fee</span>
                  </div>
                  <p className="font-bold text-slate-800">₹{doctor.consultationFee || 500}</p>
                </div>
              </div>

              {/* Qualifications */}
              {doctor.qualifications && doctor.qualifications.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Award size={18} className="text-indigo-500" />
                    Qualifications
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {doctor.qualifications.map((qual, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg">
                        {qual}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sitting Timings */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Clock size={18} className="text-indigo-500" />
                  Availability & Timings
                </h4>
                <div className="space-y-2">
                  {daysOfWeek.map(day => {
                    const avail = getDayAvailability(day);
                    return (
                      <div key={day} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-white">
                        <span className="font-medium text-slate-700 w-24">{day}</span>
                        {avail ? (
                          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md text-sm font-medium">
                            <Clock size={14} />
                            {avail.startTime} - {avail.endTime}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">Not Available</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="primary">Book Appointment</Button>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfileModal;
