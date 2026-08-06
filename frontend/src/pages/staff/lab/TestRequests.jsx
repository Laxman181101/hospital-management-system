import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Search, Filter, Clock, CheckCircle2, XCircle, AlertCircle, Upload, Eye, FileDigit } from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

const TestRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { showToast } = useToast();

  const statuses = ['Pending', 'Partial', 'Completed', 'Cancelled'];
  const testItemStatuses = ['Pending', 'Sample Collected', 'Completed', 'Cancelled'];

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('overallStatus', statusFilter);
      
      const res = await api.get(`/api/v1/laboratory/requests?${params.toString()}`);
      
      // Client side search by patient name
      let data = res.data.data;
      if (search) {
        const query = search.toLowerCase();
        data = data.filter(req => 
          req.patient?.firstName?.toLowerCase().includes(query) || 
          req.patient?.lastName?.toLowerCase().includes(query)
        );
      }
      setRequests(data);
    } catch (error) {
      showToast('error', 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [search, statusFilter]);

  const handleOpenDrawer = async (req) => {
    try {
      // Fetch full details
      const res = await api.get(`/api/v1/laboratory/requests/${req._id}`);
      setSelectedRequest(res.data.data);
      setIsDrawerOpen(true);
    } catch (error) {
      showToast('error', 'Failed to load request details');
    }
  };

  const handleUpdateTestStatus = async (testItemId, newStatus, resultNotes = '') => {
    try {
      const res = await api.patch(`/api/v1/laboratory/requests/${selectedRequest._id}/tests/${testItemId}/status`, {
        status: newStatus,
        resultNotes
      });
      showToast('success', 'Status updated successfully');
      // Update local state
      setSelectedRequest(res.data.data);
      fetchRequests(); // Refresh list to update overall status
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleUploadReport = async (testItemId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.patch(`/api/v1/laboratory/requests/${selectedRequest._id}/tests/${testItemId}/report`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('success', 'Report uploaded successfully');
      setSelectedRequest(res.data.data);
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to upload report');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Partial': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Sample Collected': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200'; // Pending
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileDigit className="w-6 h-6 text-indigo-600" />
          Test Requests
        </h1>
        <p className="text-slate-500 mt-1">Manage patient laboratory test requests and reports</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
            >
              <option value="">All Statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Request ID</th>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Tests</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    No requests found
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      #{req._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {req.patient?.firstName} {req.patient?.lastName}
                      </div>
                      {req.doctor && (
                        <div className="text-xs text-slate-500">Dr. {req.doctor.firstName} {req.doctor.lastName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {req.tests.length} tests
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(req.overallStatus)}`}>
                        {req.overallStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${req.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {req.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenDrawer(req)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium text-sm hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer for Request Details */}
      {isDrawerOpen && selectedRequest && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 z-40 transition-opacity" onClick={() => setIsDrawerOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Request #{selectedRequest._id.slice(-6).toUpperCase()}</h2>
              <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {/* Patient Info */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">Patient Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Name</p>
                    <p className="font-medium text-slate-900">{selectedRequest.patient?.firstName} {selectedRequest.patient?.lastName}</p>
                  </div>
                  {selectedRequest.doctor && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Referred By</p>
                      <p className="font-medium text-slate-900">Dr. {selectedRequest.doctor.firstName} {selectedRequest.doctor.lastName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Date</p>
                    <p className="font-medium text-slate-900">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Overall Status</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(selectedRequest.overallStatus)}`}>
                      {selectedRequest.overallStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tests List */}
              <h3 className="text-sm font-semibold text-slate-900 mb-3 px-1">Requested Tests</h3>
              <div className="space-y-4">
                {selectedRequest.tests.map((testItem) => (
                  <div key={testItem._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900">{testItem.test?.testName || 'Unknown Test'}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{testItem.test?.category}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          value={testItem.status}
                          onChange={(e) => handleUpdateTestStatus(testItem._id, e.target.value, testItem.resultNotes)}
                          className={`text-sm rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 ${getStatusColor(testItem.status)} border px-3 py-1.5 font-medium outline-none`}
                        >
                          {testItemStatuses.map(s => (
                            <option key={s} value={s} className="bg-white text-slate-900">{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-start">
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-slate-700 mb-1">Result Notes</label>
                        <textarea
                          placeholder="Add notes or normal ranges..."
                          defaultValue={testItem.resultNotes}
                          onBlur={(e) => {
                            if (e.target.value !== testItem.resultNotes) {
                              handleUpdateTestStatus(testItem._id, testItem.status, e.target.value);
                            }
                          }}
                          className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                          rows="2"
                        ></textarea>
                      </div>

                      <div className="sm:w-48 shrink-0">
                        <label className="block text-xs font-medium text-slate-700 mb-1">Report File</label>
                        {testItem.reportUrl ? (
                          <div className="flex items-center gap-2 mt-2">
                            <a 
                              href={testItem.reportUrl.startsWith('http') ? testItem.reportUrl : `http://localhost:5000${testItem.reportUrl}`}
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center justify-center w-full py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                            >
                              <Eye className="w-4 h-4 mr-2" /> View Report
                            </a>
                          </div>
                        ) : (
                          <div className="mt-2 relative">
                            <input 
                              type="file" 
                              id={`upload-${testItem._id}`}
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleUploadReport(testItem._id, e.target.files[0]);
                                }
                              }}
                            />
                            <label 
                              htmlFor={`upload-${testItem._id}`}
                              className="flex items-center justify-center w-full py-2 bg-white border border-slate-300 border-dashed rounded-lg text-sm font-medium text-slate-600 hover:border-indigo-500 hover:text-indigo-600 cursor-pointer transition-colors"
                            >
                              <Upload className="w-4 h-4 mr-2" /> Upload PDF/Img
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-white">
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="w-full py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TestRequests;
