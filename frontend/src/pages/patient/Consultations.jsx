import React, { useState, useEffect } from 'react';
import { Video, PhoneCall, MessageSquare, ExternalLink, Calendar as CalendarIcon } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';

const Consultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/appointments/my');
      // Filter for virtual consultations
      const virtualAppointments = (res.data.data || []).filter(app => ['video', 'audio', 'chat'].includes(app.appointmentType));
      setConsultations(virtualAppointments);
    } catch (error) {
      addToast('error', 'Failed to fetch consultations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  const getIconForType = (type) => {
    switch(type) {
      case 'video': return <Video size={16} className="text-blue-600" />;
      case 'audio': return <PhoneCall size={16} className="text-emerald-600" />;
      case 'chat': return <MessageSquare size={16} className="text-purple-600" />;
      default: return <Video size={16} className="text-slate-600" />;
    }
  };

  const getBgForType = (type) => {
    switch(type) {
      case 'video': return 'bg-blue-100';
      case 'audio': return 'bg-emerald-100';
      case 'chat': return 'bg-purple-100';
      default: return 'bg-slate-100';
    }
  };

  const columns = [
    {
      header: 'Type',
      key: 'appointmentType',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getBgForType(row.appointmentType)}`}>
            {getIconForType(row.appointmentType)}
          </div>
          <span className="capitalize font-medium text-slate-900">{row.appointmentType} Consultation</span>
        </div>
      )
    },
    {
      header: 'Doctor',
      key: 'doctor.user.firstName',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900">Dr. {row.doctor?.user?.firstName} {row.doctor?.user?.lastName}</div>
          <div className="text-xs text-slate-500">{row.doctor?.specialization}</div>
        </div>
      )
    },
    {
      header: 'Date & Time',
      key: 'appointmentDate',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800 flex items-center gap-1">
            <CalendarIcon size={14} className="text-slate-400" />
            {new Date(row.appointmentDate).toLocaleDateString()}
          </div>
          <div className="text-sm text-slate-500 mt-0.5 ml-5">
            {row.startTime}
          </div>
        </div>
      )
    },
    {
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (row) => {
        const isToday = new Date(row.appointmentDate).toDateString() === new Date().toDateString();
        const isPending = row.status === 'pending' || row.status === 'confirmed';
        
        if (isPending) {
          return (
            <Button 
              className="text-xs py-1.5 px-4" 
              disabled={!isToday}
              title={!isToday ? "Link will be active on the day of consultation" : "Join Consultation"}
              onClick={() => addToast('info', 'Connecting to secure consultation room...')}
            >
              Join Now <ExternalLink size={14} className="ml-1" />
            </Button>
          );
        }
        return <span className="text-xs font-medium text-slate-400 capitalize">{row.status}</span>;
      }
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Consultations</h1>
        <p className="text-sm text-slate-500 mt-1">Join your upcoming virtual consultations with doctors.</p>
      </div>

      <div className="h-[600px]">
        <DataTable 
          columns={columns} 
          data={consultations} 
          loading={loading}
          keyField="_id"
          emptyIcon={Video}
          emptyTitle="No virtual consultations"
          emptyDescription="You don't have any upcoming or past video/audio consultations."
        />
      </div>
    </div>
  );
};

export default Consultations;
