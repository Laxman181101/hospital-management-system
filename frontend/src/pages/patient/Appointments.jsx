import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Video, MessageSquare, MapPin } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import VideoRoomModal from '../../components/consultation/VideoRoomModal';
import ChatRoomModal from '../../components/consultation/ChatRoomModal';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useToast } from '../../context/ToastContext';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoAppt, setActiveVideoAppt] = useState(null);
  const [activeChatAppt, setActiveChatAppt] = useState(null);
  const [activeCallIds, setActiveCallIds] = useState(new Set());
  const { addToast } = useToast();

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/appointments/my');
      setAppointments(res.data.data || []);
    } catch (error) {
      addToast('error', 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();

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

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await api.patch(`/api/v1/appointments/${id}/cancel`);
        addToast('success', 'Appointment cancelled successfully');
        fetchAppointments();
      } catch (error) {
        addToast('error', 'Failed to cancel appointment');
      }
    }
  };

  const columns = [
    {
      header: 'Date & Time',
      key: 'appointmentDate',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800">
            {new Date(row.appointmentDate).toLocaleDateString()}
          </div>
          <div className="text-sm text-slate-500">
            {row.startTime} - {row.endTime}
          </div>
        </div>
      )
    },
    {
      header: 'Doctor',
      key: 'doctor.name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
            {row.doctor?.name?.charAt(0) || row.doctor?.user?.firstName?.charAt(0) || 'D'}
          </div>
          <div>
            <div className="font-medium text-slate-900">Dr. {row.doctor?.name || row.doctor?.user?.firstName + ' ' + row.doctor?.user?.lastName}</div>
            <div className="text-xs text-slate-500">{row.doctor?.specialization}</div>
            {row.doctor?.experience ? (
              <div className="text-[10px] text-slate-400">{row.doctor.experience} Yrs Exp.</div>
            ) : null}
          </div>
        </div>
      )
    },
    {
      header: 'Hospital',
      key: 'hospital.hospitalName',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-slate-700">{row.hospital?.hospitalName || 'N/A'}</div>
          {row.appointmentType === 'physical' && (
            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin size={12} /> {row.hospital?.address?.city || 'Location'}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Type',
      key: 'appointmentType',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.appointmentType === 'physical' && <Calendar size={14} className="text-slate-500" />}
          {row.appointmentType === 'video' && <Video size={14} className="text-blue-500" />}
          {row.appointmentType === 'chat' && <MessageSquare size={14} className="text-emerald-500" />}
          <span className="capitalize text-sm font-medium text-slate-700">{row.appointmentType}</span>
        </div>
      )
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
        const isPendingOrConfirmed = row.status === 'pending' || row.status === 'confirmed';

        return (
          <div className="flex items-center justify-end gap-2">
            {isVirtual && isPendingOrConfirmed && (
              activeCallIds.has(row._id.toString()) ? (
                <Button
                  size="sm"
                  className="text-xs py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 font-bold animate-pulse"
                  onClick={() => {
                    if (row.appointmentType === 'video' || row.appointmentType === 'audio') {
                      setActiveVideoAppt(row);
                    } else {
                      setActiveChatAppt(row);
                    }
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  Join Call (Live Now)
                </Button>
              ) : (
                <div className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                  <Clock size={11} className="text-amber-500" />
                  <span>Waiting for Doctor</span>
                </div>
              )
            )}

            {isPendingOrConfirmed && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleCancel(row._id); }}
                className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}

            {!isPendingOrConfirmed && <span className="text-xs text-slate-400 capitalize">{row.status}</span>}
          </div>
        );
      }
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-sm text-slate-500 mt-1">View and manage your upcoming and past appointments.</p>
        </div>
      </div>

      <div className="h-[600px]">
        <DataTable 
          columns={columns} 
          data={appointments} 
          loading={loading}
          keyField="_id"
          emptyIcon={Clock}
          emptyTitle="No appointments found"
          emptyDescription="You haven't booked any appointments yet."
        />
      </div>

      {activeVideoAppt && (
        <VideoRoomModal
          isOpen={Boolean(activeVideoAppt)}
          onClose={() => setActiveVideoAppt(null)}
          consultationData={activeVideoAppt}
          onConsultationComplete={fetchAppointments}
        />
      )}

      {activeChatAppt && (
        <ChatRoomModal
          isOpen={Boolean(activeChatAppt)}
          onClose={() => setActiveChatAppt(null)}
          consultationData={activeChatAppt}
          onSessionEnd={fetchAppointments}
        />
      )}
    </div>
  );
};

export default Appointments;
