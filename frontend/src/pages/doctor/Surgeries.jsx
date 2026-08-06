import React, { useState, useEffect } from 'react';
import { Activity, Search, Calendar, Clock, MapPin, Edit, X, Plus } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const DoctorSurgeries = () => {
  const { user } = useAuth();
  const [surgeries, setSurgeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [updateData, setUpdateData] = useState({
    status: 'In-Progress',
    postOpNotes: '',
    otRoomCharge: '',
    surgeonFee: '',
    anesthetistFee: '',
    consumableCharges: ''
  });

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [requestData, setRequestData] = useState({
    patientId: '',
    surgeryName: '',
    scheduledDate: '',
    preOpNotes: ''
  });

  const fetchPatients = async () => {
    try {
      const res = await api.get('/api/v1/patients');
      setPatients(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSurgeries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/operation-theaters/surgeries');
      setSurgeries(res.data.data || []);
    } catch (err) {
      addToast('error', 'Failed to fetch surgeries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurgeries();
    fetchPatients();
  }, []);

  const columns = [
    {
      header: 'Surgery Name',
      key: 'surgeryName',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-900">{row.surgeryName}</span>
    },
    {
      header: 'Patient',
      key: 'patientId',
      render: (row) => (
        <span className="font-medium text-slate-700">
          {row.patientId?.firstName || row.patientId?.name || 'Unknown'} {row.patientId?.lastName || ''}
        </span>
      )
    },
    {
      header: 'Schedule',
      key: 'scheduledDate',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800 flex items-center gap-1">
            <Calendar size={14} className="text-slate-400" />
            {new Date(row.scheduledDate).toLocaleDateString()}
          </div>
          <div className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
            <Clock size={14} className="text-slate-400" />
            {row.startTime} - {row.endTime}
          </div>
        </div>
      )
    },
    {
      header: 'Operation Theater',
      key: 'operationTheaterId',
      render: (row) => (
        <span className="flex items-center gap-1 text-slate-700">
          <MapPin size={14} className="text-slate-400" />
          {row.operationTheaterId?.name || 'Unknown OT'}
        </span>
      )
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (row) => {
        const getStatusColor = (status) => {
          switch (status) {
            case 'Requested': return 'bg-gray-100 text-gray-800 border border-gray-200';
            case 'Scheduled': return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'In-Progress': return 'bg-amber-100 text-amber-800 border border-amber-200';
            case 'Recovery': return 'bg-purple-100 text-purple-800 border border-purple-200';
            case 'Completed': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
            case 'Cancelled': return 'bg-red-100 text-red-800 border border-red-200';
            default: return 'bg-slate-100 text-slate-800';
          }
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>{row.status}</span>;
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex justify-end">
          <button 
            onClick={() => {
              setSelectedSurgery(row);
              setUpdateData({
                status: row.status === 'Scheduled' ? 'In-Progress' : (row.status === 'In-Progress' ? 'Completed' : row.status),
                postOpNotes: row.postOpNotes || '',
                otRoomCharge: row.otRoomCharge || '',
                surgeonFee: row.surgeonFee || '',
                anesthetistFee: row.anesthetistFee || '',
                consumableCharges: row.consumableCharges || ''
              });
              setIsUpdateModalOpen(true);
            }}
            className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
            disabled={row.status === 'Completed' || row.status === 'Cancelled'}
          >
            <Edit size={16} />
            Update Status
          </button>
        </div>
      )
    }
  ];

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        status: updateData.status,
        postOpNotes: updateData.postOpNotes
      };
      
      // Only include fees if status is Completed
      if (updateData.status === 'Completed') {
        if (updateData.otRoomCharge) payload.otRoomCharge = Number(updateData.otRoomCharge);
        if (updateData.surgeonFee) payload.surgeonFee = Number(updateData.surgeonFee);
        if (updateData.anesthetistFee) payload.anesthetistFee = Number(updateData.anesthetistFee);
        if (updateData.consumableCharges) payload.consumableCharges = Number(updateData.consumableCharges);
      }
      
      await api.patch(`/api/v1/operation-theaters/surgeries/${selectedSurgery._id}/status`, payload);
      addToast('success', 'Surgery updated successfully');
      setIsUpdateModalOpen(false);
      fetchSurgeries();
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to update surgery');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Surgeries / OT</h1>
          <p className="text-sm text-slate-500 mt-1">View your scheduled surgeries and operation theater assignments.</p>
        </div>
        <button 
          onClick={() => setIsRequestModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium"
        >
          <Plus size={18} />
          Request OT
        </button>
      </div>

      <div className="h-[600px]">
        <DataTable 
          columns={columns} 
          data={surgeries} 
          loading={loading}
          keyField="_id"
          emptyIcon={Activity}
          emptyTitle="No surgeries scheduled"
          emptyDescription="You have no upcoming surgeries in the operation theater."
        />
      </div>

      {/* Update Status Modal */}
      {isUpdateModalOpen && selectedSurgery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Update Surgery: {selectedSurgery.surgeryName}</h3>
              <button onClick={() => setIsUpdateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleUpdateStatus} className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={updateData.status}
                    onChange={e => setUpdateData({...updateData, status: e.target.value})}
                    required
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In-Progress">In-Progress</option>
                    <option value="Recovery">Recovery</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Post-Operative Notes</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Enter operative notes, complications, etc."
                    value={updateData.postOpNotes}
                    onChange={e => setUpdateData({...updateData, postOpNotes: e.target.value})}
                  />
                </div>

                {updateData.status === 'Completed' && (
                  <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 space-y-4">
                    <h4 className="font-bold text-indigo-900 text-sm uppercase tracking-wider">Final OT Billing & Charges</h4>
                    <p className="text-xs text-indigo-600 mb-4">These charges will be automatically added to the patient's IPD Discharge Bill.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Surgeon Fee (₹)</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                          placeholder="0.00"
                          value={updateData.surgeonFee}
                          onChange={e => setUpdateData({...updateData, surgeonFee: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Anesthetist Fee (₹)</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                          placeholder="0.00"
                          value={updateData.anesthetistFee}
                          onChange={e => setUpdateData({...updateData, anesthetistFee: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">OT Room Charge (₹)</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                          placeholder="0.00"
                          value={updateData.otRoomCharge}
                          onChange={e => setUpdateData({...updateData, otRoomCharge: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Consumables / Equipment (₹)</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                          placeholder="0.00"
                          value={updateData.consumableCharges}
                          onChange={e => setUpdateData({...updateData, consumableCharges: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-6 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save & Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Request OT Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Request Operation Theater</h3>
              <button onClick={() => setIsRequestModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              try {
                // Ensure doctor ID is passed as surgeonId
                const surgeonId = user?._id || user?.sub;
                
                await api.post('/api/v1/operation-theaters/requests', {
                  ...requestData,
                  surgeonId
                });
                addToast('success', 'OT Request submitted successfully');
                setIsRequestModalOpen(false);
                fetchSurgeries();
              } catch (err) {
                addToast('error', err.response?.data?.message || 'Failed to request OT');
              } finally {
                setSubmitting(false);
              }
            }} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Patient</label>
                  <select
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    value={requestData.patientId}
                    onChange={e => setRequestData({...requestData, patientId: e.target.value})}
                    required
                  >
                    <option value="">Select Patient</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id}>{p.firstName || p.name} {p.lastName || ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Surgery Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Appendectomy"
                    value={requestData.surgeryName}
                    onChange={e => setRequestData({...requestData, surgeryName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    value={requestData.scheduledDate}
                    onChange={e => setRequestData({...requestData, scheduledDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pre-Operative Notes</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    placeholder="Any specific requests or requirements..."
                    value={requestData.preOpNotes}
                    onChange={e => setRequestData({...requestData, preOpNotes: e.target.value})}
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-6 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSurgeries;
