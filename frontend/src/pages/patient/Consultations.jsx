import React, { useState, useEffect } from 'react';
import { 
  Video, 
  PhoneCall, 
  MessageSquare, 
  ExternalLink, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Filter, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import VideoRoomModal from '../../components/consultation/VideoRoomModal';
import ChatRoomModal from '../../components/consultation/ChatRoomModal';

const Consultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [filteredConsultations, setFilteredConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [activeCallIds, setActiveCallIds] = useState(new Set());
  
  // Modals state
  const [activeVideoConsultation, setActiveVideoConsultation] = useState(null);
  const [activeChatConsultation, setActiveChatConsultation] = useState(null);

  const { addToast } = useToast();

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/appointments/my');
      // Filter for virtual consultations (video, audio, chat)
      const virtualAppointments = (res.data.data || []).filter(app => 
        ['video', 'audio', 'chat'].includes(app.appointmentType)
      );
      setConsultations(virtualAppointments);
      setFilteredConsultations(virtualAppointments);
    } catch (error) {
      addToast('error', 'Failed to fetch consultations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();

    const s = getSocket();
    if (s) {
      const handleIncoming = (data) => {
        const id = data?.appointment?._id || data?.appointment?.id;
        if (id) {
          setActiveCallIds(prev => new Set(prev).add(id.toString()));
        }
      };
      s.on('incoming_call', handleIncoming);
      return () => {
        s.off('incoming_call', handleIncoming);
      };
    }
  }, []);

  useEffect(() => {
    if (selectedTab === 'all') {
      setFilteredConsultations(consultations);
    } else {
      setFilteredConsultations(consultations.filter(c => c.appointmentType === selectedTab));
    }
  }, [selectedTab, consultations]);

  const handleJoinConsultation = (row) => {
    if (row.appointmentType === 'video') {
      setActiveVideoConsultation(row);
    } else if (row.appointmentType === 'chat') {
      setActiveChatConsultation(row);
    } else if (row.appointmentType === 'audio') {
      setActiveVideoConsultation(row); // Audio utilizes WebRTC/Jitsi with voice
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'video': return <Video size={16} className="text-blue-600" />;
      case 'audio': return <PhoneCall size={16} className="text-emerald-600" />;
      case 'chat': return <MessageSquare size={16} className="text-purple-600" />;
      default: return <Video size={16} className="text-slate-600" />;
    }
  };

  const getBgForType = (type) => {
    switch (type) {
      case 'video': return 'bg-blue-100/80';
      case 'audio': return 'bg-emerald-100/80';
      case 'chat': return 'bg-purple-100/80';
      default: return 'bg-slate-100';
    }
  };

  const columns = [
    {
      header: 'Consultation Mode',
      key: 'appointmentType',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${getBgForType(row.appointmentType)}`}>
            {getIconForType(row.appointmentType)}
          </div>
          <div>
            <span className="capitalize font-semibold text-slate-900 block text-sm">
              {row.appointmentType} Consultation
            </span>
            <span className="text-xs text-slate-500">
              {row.appointmentType === 'video' ? 'Live Video Room' : row.appointmentType === 'chat' ? 'Real-Time Messaging' : 'Voice Call'}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Doctor',
      key: 'doctor.user.firstName',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900 text-sm">
            Dr. {row.doctor?.user?.firstName || row.doctor?.name || 'Assigned Doctor'} {row.doctor?.user?.lastName || ''}
          </div>
          <div className="text-xs font-medium text-indigo-600">{row.doctor?.specialization || 'Medical Specialist'}</div>
          {row.hospital && (
            <div className="text-[11px] text-slate-400 mt-0.5">{row.hospital.name}</div>
          )}
        </div>
      )
    },
    {
      header: 'Date & Time',
      key: 'appointmentDate',
      sortable: true,
      render: (row) => {
        const d = new Date(row.appointmentDate);
        return (
          <div>
            <div className="font-medium text-slate-800 flex items-center gap-1.5 text-sm">
              <CalendarIcon size={14} className="text-slate-400" />
              {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 ml-5 flex items-center gap-1">
              <Clock size={12} className="text-slate-400" />
              {row.startTime} {row.endTime ? `- ${row.endTime}` : ''}
            </div>
          </div>
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
        const isCompleted = row.status === 'completed';
        const isCancelled = row.status === 'cancelled';
        
        if (isCancelled) {
          return <span className="text-xs font-medium text-slate-400">Cancelled</span>;
        }

        if (isCompleted) {
          return (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
              Consulted ✓
            </span>
          );
        }

        const isDoctorLive = activeCallIds.has(row._id.toString());

        return (
          <div className="flex items-center justify-end gap-2">
            {isDoctorLive ? (
              <Button 
                size="sm"
                className="text-xs py-1.5 px-3.5 flex items-center gap-1.5 shadow-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse"
                onClick={() => handleJoinConsultation(row)}
              >
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                {row.appointmentType === 'video' ? <Video size={14} /> : <MessageSquare size={14} />}
                <span>Join Call (Live Now)</span>
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
                <Clock size={12} className="text-amber-500" />
                <span>Waiting for Doctor</span>
              </div>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Virtual Consultations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Connect live with your healthcare specialists via secure Video and Chat consultations.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'all', label: 'All Virtual' },
          { id: 'video', label: 'Video Calls', icon: Video },
          { id: 'chat', label: 'Chat Sessions', icon: MessageSquare },
          { id: 'audio', label: 'Audio Calls', icon: PhoneCall },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSelectedTab(id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              selectedTab === id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {Icon && <Icon size={14} />}
            {label}
            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedTab === id ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {id === 'all' ? consultations.length : consultations.filter(c => c.appointmentType === id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Consultations Table */}
      <div className="h-[550px]">
        <DataTable 
          columns={columns} 
          data={filteredConsultations} 
          loading={loading}
          keyField="_id"
          emptyIcon={Video}
          emptyTitle="No virtual consultations"
          emptyDescription="You don't have any virtual consultations booked in this category. Schedule a video or chat appointment anytime!"
        />
      </div>

      {/* Video Meeting Room Modal */}
      {activeVideoConsultation && (
        <VideoRoomModal
          isOpen={Boolean(activeVideoConsultation)}
          onClose={() => setActiveVideoConsultation(null)}
          consultationData={activeVideoConsultation}
          onConsultationComplete={fetchConsultations}
        />
      )}

      {/* Real-time Chat Room Modal */}
      {activeChatConsultation && (
        <ChatRoomModal
          isOpen={Boolean(activeChatConsultation)}
          onClose={() => setActiveChatConsultation(null)}
          consultationData={activeChatConsultation}
          onSessionEnd={fetchConsultations}
        />
      )}
    </div>
  );
};

export default Consultations;
