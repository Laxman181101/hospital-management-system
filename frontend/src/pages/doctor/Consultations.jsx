import React, { useState, useEffect } from 'react';
import { 
  Video, 
  FileText, 
  Calendar, 
  Plus, 
  X, 
  Search, 
  User, 
  Bed, 
  Activity, 
  Download, 
  MessageSquare, 
  Clock, 
  PhoneCall, 
  CheckCircle 
} from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import VideoRoomModal from '../../components/consultation/VideoRoomModal';
import ChatRoomModal from '../../components/consultation/ChatRoomModal';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const DoctorConsultations = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('virtual'); // 'virtual' or 'history'
  const [history, setHistory] = useState([]);
  const [virtualAppointments, setVirtualAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { addToast } = useToast();

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);

  // Active Modals
  const [activeVideoAppt, setActiveVideoAppt] = useState(null);
  const [activeChatAppt, setActiveChatAppt] = useState(null);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/api/v1/consultations');
      setHistory(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVirtualAppointments = async () => {
    try {
      const res = await api.get('/api/v1/appointments/doctor');
      const all = res.data.data || [];
      const virtual = all.filter(a => ['video', 'chat', 'audio'].includes(a.appointmentType));
      setVirtualAppointments(virtual);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/api/v1/appointments/${id}/status`, { status: newStatus });
      addToast('success', `Appointment status reverted to ${newStatus}`);
      fetchVirtualAppointments();
    } catch (err) {
      addToast('error', `Failed to update status`);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchHistory(), fetchVirtualAppointments()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const virtualColumns = [
    {
      header: 'Patient Info',
      key: 'patient',
      render: (row) => {
        const p = row.patient;
        const patientName = 
          (p?.user ? `${p.user.firstName || ''} ${p.user.lastName || ''}`.trim() : '') ||
          (p?.firstName ? `${p.firstName} ${p.lastName || ''}`.trim() : '') ||
          p?.name ||
          row.patientName ||
          'Patient';
        const initial = patientName.charAt(0).toUpperCase() || 'P';
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold uppercase shadow-sm border border-indigo-100">
              {initial}
            </div>
            <div>
              <div className="font-bold text-slate-900">{patientName}</div>
              <div className="text-xs text-slate-500">Gender: <span className="capitalize">{p?.gender || p?.user?.gender || 'N/A'}</span></div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Consultation Mode',
      key: 'appointmentType',
      render: (row) => {
        if (row.appointmentType === 'video') {
          return (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Video size={13} />
              <span>Video Consultation</span>
            </div>
          );
        } else if (row.appointmentType === 'chat') {
          return (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              <MessageSquare size={13} />
              <span>Live Chat</span>
            </div>
          );
        }
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <PhoneCall size={13} />
            <span>Audio Call</span>
          </div>
        );
      }
    },
    {
      header: 'Date & Time',
      key: 'appointmentDate',
      render: (row) => {
        const d = new Date(row.appointmentDate);
        return (
          <div className="flex flex-col">
            <span className="font-medium text-slate-800 flex items-center gap-1.5 text-xs">
              <Calendar size={13} className="text-slate-400" />
              {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-xs text-slate-500 mt-0.5 ml-4 flex items-center gap-1">
              <Clock size={11} className="text-slate-400" />
              {row.startTime} {row.endTime ? `- ${row.endTime}` : ''}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <Badge status={row.status}>{row.status}</Badge>
    },
    {
      header: 'Launch Consultation',
      key: 'action',
      align: 'right',
      render: (row) => {
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

        if (row.status === 'completed') {
          return (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
              Consulted ✓
            </span>
          );
        }

        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              className={`text-xs py-1.5 px-4 font-semibold flex items-center gap-1.5 shadow-sm ${
                row.appointmentType === 'video'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200'
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
              {row.appointmentType === 'video' ? <Video size={14} /> : <MessageSquare size={14} />}
              <span>{row.appointmentType === 'video' ? 'Start Video Call' : 'Open Live Chat'}</span>
            </Button>
          </div>
        );
      }
    }
  ];

  const historyColumns = [
    {
      header: 'Patient Info',
      key: 'patient',
      render: (row) => {
        const p = row.patient;
        const patientName = 
          (p?.user ? `${p.user.firstName || ''} ${p.user.lastName || ''}`.trim() : '') ||
          (p?.firstName ? `${p.firstName} ${p.lastName || ''}`.trim() : '') ||
          p?.name ||
          row.patientName ||
          'Patient';
        const initial = patientName.charAt(0).toUpperCase() || 'P';
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold uppercase shadow-sm border border-indigo-100">
              {initial}
            </div>
            <div>
              <div className="font-bold text-slate-900">{patientName}</div>
              <div className="text-xs text-slate-500">History Record</div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Date & Time',
      key: 'createdAt',
      render: (row) => {
        const d = new Date(row.createdAt);
        return (
          <div className="flex flex-col">
            <span className="font-medium text-slate-800 flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-xs text-slate-500 mt-0.5 ml-5">
              {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Diagnosis',
      key: 'diagnosis',
      render: (row) => (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
          <Activity size={12} className="mr-1" />
          <span className="truncate max-w-[150px]">{row.diagnosis || 'No Diagnosis'}</span>
        </div>
      )
    },
    {
      header: 'View Details',
      key: 'view',
      align: 'center',
      render: (row) => (
        <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => { setSelectedHistory(row); setShowViewModal(true); }}>
          <FileText size={14} className="mr-1.5" /> Details
        </Button>
      )
    },
    {
      header: 'Download',
      key: 'download',
      align: 'right',
      render: (row) => (
        <div>
          {row.prescriptionPdf ? (
            <Button 
              size="sm" 
              variant="outline" 
              className="text-teal-600 border-teal-200 hover:bg-teal-50" 
              onClick={() => window.open(`http://localhost:5000${row.prescriptionPdf}`, '_blank')}
            >
              <Download size={14} className="mr-1.5" /> PDF
            </Button>
          ) : (
            <span className="text-xs text-slate-400 italic">No PDF</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctor Consultations Hub</h1>
          <p className="text-sm text-slate-500 mt-1">Manage scheduled video/chat telehealth sessions and historical clinical notes.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('virtual')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'virtual'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Video size={16} />
          Live Virtual Appointments
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            activeTab === 'virtual' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {virtualAppointments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText size={16} />
          Past Clinical Records
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            activeTab === 'history' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {history.length}
          </span>
        </button>
      </div>

      {/* Tables based on tab */}
      <div className="h-[520px]">
        {activeTab === 'virtual' ? (
          <DataTable 
            columns={virtualColumns} 
            data={virtualAppointments} 
            loading={loading}
            emptyIcon={Video}
            emptyTitle="No virtual appointments scheduled"
            emptyDescription="You have no upcoming video or chat consultations assigned at the moment."
          />
        ) : (
          <DataTable 
            columns={historyColumns} 
            data={history} 
            loading={loading}
            emptyIcon={FileText}
            emptyTitle="No consultation history"
            emptyDescription="Completed consultation diagnosis records will appear here."
          />
        )}
      </div>

      {/* Video Meeting Room Modal */}
      {activeVideoAppt && (
        <VideoRoomModal
          isOpen={Boolean(activeVideoAppt)}
          onClose={() => setActiveVideoAppt(null)}
          consultationData={activeVideoAppt}
          onConsultationComplete={loadData}
        />
      )}

      {/* Real-time Chat Room Modal */}
      {activeChatAppt && (
        <ChatRoomModal
          isOpen={Boolean(activeChatAppt)}
          onClose={() => setActiveChatAppt(null)}
          consultationData={activeChatAppt}
          onSessionEnd={loadData}
        />
      )}

      {/* View Consultation Modal */}
      {showViewModal && selectedHistory && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Consultation Details</h2>
                <p className="text-sm text-slate-500">Date: {new Date(selectedHistory.createdAt).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Patient Info</h3>
                <p className="font-bold text-slate-900">{selectedHistory.patient?.name || `${selectedHistory.patient?.firstName || ''} ${selectedHistory.patient?.lastName || ''}`.trim() || 'Unknown'}</p>
                <p className="text-sm text-slate-600">Gender: <span className="capitalize">{selectedHistory.patient?.gender || 'N/A'}</span></p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Symptoms</h3>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[60px] text-sm text-slate-700 whitespace-pre-wrap">
                    {selectedHistory.symptoms || 'N/A'}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Chief Complaints</h3>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[60px] text-sm text-slate-700 whitespace-pre-wrap">
                    {selectedHistory.complaints || 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Diagnosis</h3>
                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 font-medium text-indigo-900">
                  {selectedHistory.diagnosis || 'N/A'}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Clinical Notes</h3>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[80px] text-sm text-slate-700 whitespace-pre-wrap">
                  {selectedHistory.clinicalNotes || 'N/A'}
                </div>
              </div>

              {(selectedHistory.followUpDate || selectedHistory.followUpRecommendations) && (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <h3 className="text-xs font-semibold text-orange-800 uppercase tracking-wider mb-3">Follow-up Plan</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedHistory.followUpDate && (
                      <div>
                        <span className="block text-xs text-orange-600 font-medium">Date</span>
                        <span className="font-semibold text-orange-900">{new Date(selectedHistory.followUpDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {selectedHistory.followUpRecommendations && (
                      <div>
                        <span className="block text-xs text-orange-600 font-medium">Recommendations</span>
                        <span className="text-sm font-medium text-orange-900">{selectedHistory.followUpRecommendations}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                {selectedHistory.prescriptionPdf ? (
                  <Button 
                    onClick={() => window.open(`http://localhost:5000${selectedHistory.prescriptionPdf}`, '_blank')}
                    className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
                  >
                    <Download size={16} /> Download Prescription
                  </Button>
                ) : (
                  <p className="text-sm text-slate-500 italic">No prescription generated.</p>
                )}
              </div>
              <Button variant="outline" onClick={() => setShowViewModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorConsultations;
