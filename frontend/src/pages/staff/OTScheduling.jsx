import React, { useState, useEffect } from 'react';
import { Activity, Plus, Search, MapPin, Calendar, Clock, X, User, Edit, Trash2 } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const OTScheduling = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('surgeries'); // 'requests', 'surgeries' or 'rooms'
  const [loading, setLoading] = useState(true);
  
  const [surgeries, setSurgeries] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [patients, setPatients] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isSurgeryModalOpen, setIsSurgeryModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [roomData, setRoomData] = useState({ name: '', type: 'General', capacity: 1, description: '', status: 'Available' });
  const [surgeryData, setSurgeryData] = useState({
    patientId: '', admissionId: '', operationTheaterId: '', surgeonId: '',
    surgeryName: '', scheduledDate: '', startTime: '', endTime: ''
  });
  const [rescheduleData, setRescheduleData] = useState({
    scheduledDate: '', startTime: '', endTime: ''
  });
  const [approveData, setApproveData] = useState({
    operationTheaterId: '', anesthetistId: '', scheduledDate: '', startTime: '', endTime: ''
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'surgeries' || activeTab === 'requests') {
        const [surgRes, roomsRes, patRes, docRes, admRes] = await Promise.all([
          api.get('/api/v1/operation-theaters/surgeries'),
          api.get('/api/v1/operation-theaters/rooms'),
          api.get('/api/v1/patients'),
          api.get('/api/v1/doctors'),
          api.get('/api/v1/ward/admissions?status=Occupied')
        ]);
        setSurgeries(surgRes.data.data || []);
        setRooms(roomsRes.data.data || []);
        setPatients(Array.isArray(patRes.data) ? patRes.data : (patRes.data.data || []));
        setDoctors(docRes.data.doctors || docRes.data.data || []);
        setAdmissions(admRes.data.allocations || admRes.data.data || []);
      } else {
        const res = await api.get('/api/v1/operation-theaters/rooms');
        setRooms(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/v1/operation-theaters/rooms', roomData);
      addToast('success', 'OT Room created successfully');
      setIsRoomModalOpen(false);
      setRoomData({ name: '', type: 'General', capacity: 1, description: '', status: 'Available' });
      fetchData();
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to create room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    try {
      await api.delete(`/api/v1/operation-theaters/rooms/${id}`);
      addToast('success', 'Room deleted successfully');
      fetchData();
    } catch (err) {
      addToast('error', 'Failed to delete room');
    }
  };

  const handleSurgerySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/v1/operation-theaters/surgeries', surgeryData);
      addToast('success', 'Surgery scheduled successfully');
      setIsSurgeryModalOpen(false);
      setSurgeryData({
        patientId: '', admissionId: '', operationTheaterId: '', surgeonId: '',
        surgeryName: '', scheduledDate: '', startTime: '', endTime: ''
      });
      fetchData();
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to schedule surgery');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/api/v1/operation-theaters/surgeries/${selectedSurgery._id}/reschedule`, rescheduleData);
      addToast('success', 'Surgery rescheduled successfully');
      setIsRescheduleModalOpen(false);
      fetchData();
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to reschedule surgery');
    } finally {
      setSubmitting(false);
    }
  };

  const openRescheduleModal = (surgery) => {
    setSelectedSurgery(surgery);
    setRescheduleData({
      scheduledDate: surgery.scheduledDate ? surgery.scheduledDate.split('T')[0] : '',
      startTime: surgery.startTime || '',
      endTime: surgery.endTime || ''
    });
    setIsRescheduleModalOpen(true);
  };

  const updateSurgeryStatus = async (id, status) => {
    try {
      await api.patch(`/api/v1/operation-theaters/surgeries/${id}`, { status });
      addToast('success', `Surgery marked as ${status}`);
      fetchData();
    } catch (err) {
      addToast('error', 'Failed to update status');
    }
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...approveData };
      if (!payload.anesthetistId) {
        delete payload.anesthetistId;
      }
      await api.patch(`/api/v1/operation-theaters/surgeries/${selectedSurgery._id}/schedule`, payload);
      addToast('success', 'Surgery approved and scheduled successfully');
      setIsApproveModalOpen(false);
      fetchData();
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to approve surgery');
    } finally {
      setSubmitting(false);
    }
  };

  const openApproveModal = (surgery) => {
    setSelectedSurgery(surgery);
    setApproveData({
      operationTheaterId: '',
      anesthetistId: '',
      scheduledDate: surgery.scheduledDate ? surgery.scheduledDate.split('T')[0] : '',
      startTime: '',
      endTime: ''
    });
    setIsApproveModalOpen(true);
  };

  const surgeryColumns = [
    {
      header: 'Surgery Details',
      accessor: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.surgeryName}</p>
          <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
            <User size={14} /> <span>{row.patientId?.name || row.patientId?.firstName || 'Unknown Patient'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Surgeon',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">
            {row.surgeonId?.firstName?.charAt(0) || 'Dr'}
          </div>
          <span className="font-medium text-slate-700">Dr. {row.surgeonId?.firstName || 'Unknown'} {row.surgeonId?.lastName || ''}</span>
        </div>
      )
    },
    {
      header: 'OT Room',
      accessor: (row) => (
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <div className="p-1.5 bg-slate-100 rounded text-slate-500">
            <MapPin size={14} />
          </div>
          <span>{row.operationTheater?.name || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Schedule',
      accessor: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-800 font-medium text-sm">
            <Calendar size={14} className="text-slate-400" />
            <span>{row.scheduledDate ? new Date(row.scheduledDate).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Clock size={14} />
            <span>{row.startTime} - {row.endTime}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (row) => {
        const variants = { Scheduled: 'warning', Ongoing: 'info', Completed: 'success', Cancelled: 'danger' };
        return <Badge variant={variants[row.status] || 'default'}>{row.status}</Badge>;
      }
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.status === 'Requested' && (
            <Button size="sm" className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 py-1 px-2 text-xs" onClick={() => openApproveModal(row)}>
              Approve & Schedule
            </Button>
          )}
          {row.status === 'Scheduled' && (
            <Button size="sm" className="bg-blue-50 text-blue-600 hover:bg-blue-100 py-1 px-2 text-xs" onClick={() => updateSurgeryStatus(row._id, 'Ongoing')}>
              Start
            </Button>
          )}
          {row.status === 'Ongoing' && (
            <Button size="sm" className="bg-teal-50 text-teal-600 hover:bg-teal-100 py-1 px-2 text-xs" onClick={() => updateSurgeryStatus(row._id, 'Completed')}>
              Complete
            </Button>
          )}
          {(row.status === 'Scheduled' || row.status === 'Ongoing') && (
            <Button size="sm" variant="outline" className="text-slate-600 border-slate-200 hover:bg-slate-50 py-1 px-2 text-xs" onClick={() => openRescheduleModal(row)}>
              Reschedule
            </Button>
          )}
          {(row.status === 'Requested' || row.status === 'Scheduled' || row.status === 'Ongoing') && (
            <Button size="sm" variant="outline" className="text-red-600 border-red-100 hover:bg-red-50 py-1 px-2 text-xs" onClick={() => updateSurgeryStatus(row._id, 'Cancelled')}>
              Cancel
            </Button>
          )}
        </div>
      )
    }
  ];

  const requestedSurgeries = surgeries.filter(s => s.status === 'Requested');
  const scheduledSurgeries = surgeries.filter(s => s.status !== 'Requested');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Operation Theater</h1>
          <p className="text-slate-500">Manage OT rooms and schedule surgeries</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => setIsRoomModalOpen(true)}>
            <Plus size={20} /> Add Room
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2 shadow-sm" onClick={() => setIsSurgeryModalOpen(true)}>
            <Plus size={20} /> Schedule Surgery
          </Button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-6 bg-slate-50/50 rounded-t-xl px-2 pt-2 overflow-x-auto">
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors relative rounded-t-lg whitespace-nowrap ${activeTab === 'requests' ? 'bg-white text-indigo-700 border-t border-l border-r border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('requests')}
        >
          Pending Requests
          {requestedSurgeries.length > 0 && (
            <span className="ml-2 bg-indigo-100 text-indigo-600 py-0.5 px-2 rounded-full text-xs">{requestedSurgeries.length}</span>
          )}
          {activeTab === 'requests' && <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-white" />}
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors relative rounded-t-lg whitespace-nowrap ${activeTab === 'surgeries' ? 'bg-white text-teal-700 border-t border-l border-r border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('surgeries')}
        >
          Scheduled Surgeries
          {activeTab === 'surgeries' && <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-white" />}
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors relative rounded-t-lg whitespace-nowrap ${activeTab === 'rooms' ? 'bg-white text-teal-700 border-t border-l border-r border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('rooms')}
        >
          OT Rooms Configuration
          {activeTab === 'rooms' && <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-white" />}
        </button>
      </div>

      <Card className="p-0 overflow-hidden border border-slate-200">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded"></div>)}
            </div>
          </div>
        ) : activeTab === 'requests' ? (
          <DataTable columns={surgeryColumns} data={requestedSurgeries} searchPlaceholder="Search requests..." searchKeys={['surgeryName', 'patient.name']} emptyTitle="No pending requests" emptyDescription="There are no OT requests pending approval." />
        ) : activeTab === 'surgeries' ? (
          <DataTable columns={surgeryColumns} data={scheduledSurgeries} searchPlaceholder="Search scheduled surgeries..." searchKeys={['surgeryName', 'patient.name']} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-slate-50">
            {rooms.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500">No OT rooms configured.</div>
            ) : (
              rooms.map(room => (
                <Card key={room._id} className="p-5 border border-slate-200 hover:border-teal-300 transition-colors flex flex-col relative group">
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-slate-400 hover:text-red-500" onClick={() => handleDeleteRoom(room._id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{room.name}</h3>
                      <p className="text-xs text-slate-500">{room.type} • Capacity: {room.capacity}</p>
                    </div>
                    <Badge variant={room.status === 'Available' ? 'success' : room.status === 'Occupied' ? 'danger' : 'warning'}>
                      {room.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 flex-1">{room.description || 'No description provided.'}</p>
                </Card>
              ))
            )}
          </div>
        )}
      </Card>

      {/* Add Room Modal */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Add OT Room</h2>
              <button onClick={() => setIsRoomModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleRoomSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Room Name/Number *</label>
                <input type="text" value={roomData.name} onChange={(e) => setRoomData({ ...roomData, name: e.target.value })} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. OT-101" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Type</label>
                  <select value={roomData.type} onChange={(e) => setRoomData({ ...roomData, type: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                    <option value="General">General</option>
                    <option value="Cardiac">Cardiac</option>
                    <option value="Ortho">Ortho</option>
                    <option value="Gynae">Gynae</option>
                    <option value="ENT">ENT</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Status</label>
                  <select value={roomData.status} onChange={(e) => setRoomData({ ...roomData, status: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Cleaning">Cleaning</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Description / Equipment Details</label>
                <input type="text" value={roomData.description} onChange={(e) => setRoomData({ ...roomData, description: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. Equipped with C-Arm..." />
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-4 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsRoomModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700">Create Room</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Surgery Modal */}
      {isSurgeryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Schedule Surgery</h2>
                <p className="text-sm text-slate-500">Book an operation theater slot</p>
              </div>
              <button onClick={() => setIsSurgeryModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSurgerySubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Surgery Name / Procedure *</label>
                  <input type="text" value={surgeryData.surgeryName} onChange={(e) => setSurgeryData({ ...surgeryData, surgeryName: e.target.value })} required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg" placeholder="e.g. Laparoscopic Appendectomy" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Patient *</label>
                  <select 
                    value={surgeryData.patientId} 
                    onChange={(e) => {
                      const selPatient = e.target.value;
                      // Check if this patient is admitted
                      const activeAdmissions = admissions.filter(a => a.patient?._id === selPatient || a.patient === selPatient);
                      setSurgeryData({ 
                        ...surgeryData, 
                        patientId: selPatient,
                        admissionId: activeAdmissions.length > 0 ? (activeAdmissions[0]._id || '') : ''
                      });
                    }} 
                    required 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name || p.firstName + ' ' + p.lastName} 
                        {admissions.some(a => a.patient?._id === p._id || a.patient === p._id) ? ' (IPD Admitted)' : ' (OPD)'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Surgeon *</label>
                  <select value={surgeryData.surgeonId} onChange={(e) => setSurgeryData({ ...surgeryData, surgeonId: e.target.value })} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                    <option value="">-- Choose Surgeon --</option>
                    {doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.name} ({d.specialization})</option>)}
                  </select>
                </div>
                
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">OT Room *</label>
                  <select value={surgeryData.operationTheaterId} onChange={(e) => setSurgeryData({ ...surgeryData, operationTheaterId: e.target.value })} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                    <option value="">-- Choose Room --</option>
                    {rooms.map(r => <option key={r._id} value={r._id}>{r.name} ({r.type}) - {r.status}</option>)}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Date *</label>
                  <input type="date" value={surgeryData.scheduledDate} onChange={(e) => setSurgeryData({ ...surgeryData, scheduledDate: e.target.value })} required min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Start Time *</label>
                    <input type="time" value={surgeryData.startTime} onChange={(e) => setSurgeryData({ ...surgeryData, startTime: e.target.value })} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">End Time *</label>
                    <input type="time" value={surgeryData.endTime} onChange={(e) => setSurgeryData({ ...surgeryData, endTime: e.target.value })} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setIsSurgeryModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700 px-8 shadow-sm">Schedule Surgery</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Surgery Modal */}
      {isRescheduleModalOpen && selectedSurgery && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Reschedule Surgery</h2>
                <p className="text-sm text-slate-500">{selectedSurgery.surgeryName}</p>
              </div>
              <button onClick={() => setIsRescheduleModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">New Date *</label>
                <input type="date" value={rescheduleData.scheduledDate} onChange={(e) => setRescheduleData({ ...rescheduleData, scheduledDate: e.target.value })} required min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Start Time *</label>
                  <input type="time" value={rescheduleData.startTime} onChange={(e) => setRescheduleData({ ...rescheduleData, startTime: e.target.value })} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">End Time *</label>
                  <input type="time" value={rescheduleData.endTime} onChange={(e) => setRescheduleData({ ...rescheduleData, endTime: e.target.value })} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setIsRescheduleModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700 shadow-sm">Update Schedule</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Surgery Modal */}
      {isApproveModalOpen && selectedSurgery && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Approve OT Request</h2>
                <p className="text-sm text-slate-500">{selectedSurgery.surgeryName}</p>
              </div>
              <button onClick={() => setIsApproveModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleApproveSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Assign OT Room *</label>
                <select value={approveData.operationTheaterId} onChange={(e) => setApproveData({ ...approveData, operationTheaterId: e.target.value })} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                  <option value="">-- Choose Room --</option>
                  {rooms.map(r => <option key={r._id} value={r._id}>{r.name} ({r.type}) - {r.status}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Date *</label>
                <input type="date" value={approveData.scheduledDate} onChange={(e) => setApproveData({ ...approveData, scheduledDate: e.target.value })} required min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Start Time *</label>
                  <input type="time" value={approveData.startTime} onChange={(e) => setApproveData({ ...approveData, startTime: e.target.value })} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">End Time *</label>
                  <input type="time" value={approveData.endTime} onChange={(e) => setApproveData({ ...approveData, endTime: e.target.value })} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setIsApproveModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">Approve & Schedule</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OTScheduling;
