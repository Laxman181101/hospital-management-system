import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Search, Clock, MapPin, Activity, Video, MessageSquare, FileText, Plus, X, User, Bed, Pill, Trash2, FlaskConical } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import VideoRoomModal from '../../components/consultation/VideoRoomModal';
import ChatRoomModal from '../../components/consultation/ChatRoomModal';
import ConsultationFormModal from '../../components/consultation/ConsultationFormModal';
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

  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const [cancelModal, setCancelModal] = useState({ isOpen: false, appointmentId: null, reason: '' });

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/api/v1/appointments/${id}/status`, { status: newStatus });
      addToast('success', `Appointment marked as ${newStatus}`);
      fetchAppointments();
    } catch (err) {
      addToast('error', `Failed to update status to ${newStatus}`);
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelModal.reason.trim()) {
      addToast('error', 'Cancellation reason is required');
      return;
    }
    try {
      await api.patch(`/api/v1/appointments/${cancelModal.appointmentId}/status`, { 
        status: 'cancelled', 
        cancellationReason: cancelModal.reason 
      });
      addToast('success', 'Appointment cancelled successfully');
      setCancelModal({ isOpen: false, appointmentId: null, reason: '' });
      fetchAppointments();
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const handleStartConsultation = (appt) => {
    setSelectedAppt(appt);
    setShowConsultationModal(true);
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
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleUpdateStatus(row._id, 'pending')}
                  className="text-[10px] py-0.5 px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-semibold"
                  title="Undo Cancellation and Re-activate"
                >
                  Undo
                </Button>
                <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100">Cancelled</span>
              </div>
              {row.cancellationReason && (
                <span className="text-[10px] text-slate-500 mt-1 max-w-[120px] truncate" title={row.cancellationReason}>
                  Reason: {row.cancellationReason}
                </span>
              )}
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
                size="sm"
                className="bg-white text-red-600 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all text-xs py-1 px-2.5 font-semibold shadow-sm flex items-center gap-1 rounded-lg"
                onClick={() => setCancelModal({ isOpen: true, appointmentId: row._id, reason: '' })}
                title="Cancel Appointment"
              >
                <X size={14} />
                <span>Cancel</span>
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

      <ConsultationFormModal 
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        selectedAppt={selectedAppt}
        onSuccess={fetchAppointments}
      />

      {activeVideoAppt && (
        <VideoRoomModal
          isOpen={Boolean(activeVideoAppt)}
          onClose={() => setActiveVideoAppt(null)}
          consultationData={activeVideoAppt}
          onConsultationComplete={() => {
            setActiveVideoAppt(null);
            fetchAppointments();
          }}
          onRequestPrescription={(appt) => {
            setActiveVideoAppt(null);
            handleStartConsultation(appt);
          }}
        />
      )}

      {activeChatAppt && (
        <ChatRoomModal
          isOpen={Boolean(activeChatAppt)}
          onClose={() => setActiveChatAppt(null)}
          consultationData={activeChatAppt}
          onSessionEnd={() => {
            setActiveChatAppt(null);
            fetchAppointments();
          }}
          onRequestPrescription={(appt) => {
            setActiveChatAppt(null);
            handleStartConsultation(appt);
          }}
        />
      )}
      {/* Cancel Appointment Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-red-50/50">
              <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
                <XCircle size={20} /> Cancel Appointment
              </h2>
              <button onClick={() => setCancelModal({ isOpen: false, appointmentId: null, reason: '' })} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Reason for cancellation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelModal.reason}
                onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none h-24"
                placeholder="Please provide a reason to cancel this appointment..."
                autoFocus
              />
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCancelModal({ isOpen: false, appointmentId: null, reason: '' })}>
                Go Back
              </Button>
              <Button 
                onClick={handleCancelSubmit} 
                disabled={!cancelModal.reason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
