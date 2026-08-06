import React, { useState, useEffect } from 'react';
import { Building2, Search, Filter, MoreVertical, Eye, Ban, Trash2, X, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';

const Hospitals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToast } = useToast();

  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/hospitals');
      setHospitals(res.data.data || res.data || []);
    } catch (error) {
      console.error('Failed to load hospitals:', error);
      addToast('error', 'Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/api/v1/hospitals/${id}/status`);
      addToast('success', `Hospital ${currentStatus ? 'suspended' : 'activated'} successfully`);
      fetchHospitals();
      if (selectedHospital && selectedHospital._id === id) {
        setSelectedHospital(prev => ({ ...prev, isActive: !prev.isActive }));
      }
    } catch (error) {
      addToast('error', 'Failed to update hospital status');
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = window.prompt(`Type "${name}" to confirm deletion of this hospital.`);
    if (confirmed === name) {
      try {
        await api.delete(`/api/v1/hospitals/${id}`);
        addToast('success', 'Hospital deleted permanently');
        if (selectedHospital && selectedHospital._id === id) setShowDrawer(false);
        fetchHospitals();
      } catch (error) {
        addToast('error', 'Failed to delete hospital');
      }
    } else if (confirmed !== null) {
      addToast('error', 'Name did not match. Deletion cancelled.');
    }
  };

  const openDrawer = (hospital) => {
    setSelectedHospital(hospital);
    setShowDrawer(true);
  };

  const filteredHospitals = hospitals.filter(h => 
    h.hospitalName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex-1 relative overflow-hidden">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hospitals Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all registered hospitals and verify their documents</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hospital</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-16 animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-1/3 animate-pulse"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-slate-100 rounded-full ml-auto animate-pulse"></div></td>
                  </tr>
                ))
              ) : filteredHospitals.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No hospitals found matching your search.
                  </td>
                </tr>
              ) : (
                filteredHospitals.map((hospital) => (
                  <tr key={hospital._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden">
                          {hospital.logoUrl ? (
                            <img src={hospital.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                          ) : (
                            hospital.hospitalName?.charAt(0) || 'H'
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-slate-900 line-clamp-1">{hospital.hospitalName}</div>
                          <div className="text-xs text-slate-500">{hospital.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {hospital.address?.city || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {hospital.createdBy && hospital.createdBy.isApproved === false ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          Pending Approval
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          hospital.isActive ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                        }`}>
                          {hospital.isActive ? 'Active' : 'Suspended'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(hospital.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openDrawer(hospital)}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg tooltip-trigger"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(hospital._id, hospital.isActive)}
                          className={`p-1.5 rounded-lg ${hospital.isActive ? 'text-slate-400 hover:text-warning hover:bg-warning/10' : 'text-slate-400 hover:text-success hover:bg-success/10'}`}
                          title={hospital.isActive ? "Suspend" : "Activate"}
                        >
                          {hospital.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => handleDelete(hospital._id, hospital.hospitalName)}
                          className="p-1.5 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Hospital Details Modal */}
      {showDrawer && selectedHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowDrawer(false)}></div>
          <div className="relative w-full max-w-lg bg-white shadow-2xl rounded-2xl overflow-hidden animate-fade-in z-10 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Hospital Profile</h2>
              <button onClick={() => setShowDrawer(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-8 overflow-y-auto">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden">
                  {selectedHospital.logoUrl ? (
                    <img src={selectedHospital.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Building2 size={32} />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedHospital.hospitalName}</h3>
                  <p className="text-sm text-slate-500">License: {selectedHospital.licenseNumber}</p>
                  {selectedHospital.createdBy && selectedHospital.createdBy.isApproved === false ? (
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      Pending Approval
                    </span>
                  ) : (
                    <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedHospital.isActive ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {selectedHospital.isActive ? 'Active' : 'Suspended'}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">Contact Information</h4>
                <div className="space-y-2 text-sm text-slate-600">
                  <p><strong className="text-slate-800">Email:</strong> {selectedHospital.email}</p>
                  <p><strong className="text-slate-800">Phone:</strong> {selectedHospital.phone}</p>
                  <p><strong className="text-slate-800">Address:</strong> {selectedHospital.address?.street}, {selectedHospital.address?.city}, {selectedHospital.address?.state} {selectedHospital.address?.pincode}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">Verification Document</h4>
                {selectedHospital.documentUrl ? (
                  <a 
                    href={selectedHospital.documentUrl.startsWith('http') ? selectedHospital.documentUrl : `http://localhost:5000${selectedHospital.documentUrl}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl text-primary hover:bg-primary/10 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <FileText size={20} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Registration Certificate</p>
                      <p className="text-xs opacity-80">Click to view/download</p>
                    </div>
                  </a>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm flex items-center gap-2">
                    <AlertTriangle size={16} /> No document uploaded
                  </div>
                )}
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 space-y-3">
                <Button 
                  variant={selectedHospital.isActive ? "secondary" : "primary"} 
                  className="w-full"
                  onClick={() => handleToggleStatus(selectedHospital._id, selectedHospital.isActive)}
                >
                  {selectedHospital.isActive ? 'Suspend Hospital' : 'Activate Hospital'}
                </Button>
                <Button 
                  variant="danger" 
                  className="w-full"
                  onClick={() => handleDelete(selectedHospital._id, selectedHospital.hospitalName)}
                >
                  Delete Hospital
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hospitals;
