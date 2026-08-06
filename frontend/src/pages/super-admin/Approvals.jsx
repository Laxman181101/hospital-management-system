import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, Search, Filter } from 'lucide-react';
import { superAdminService } from '../../services/super-admin.service';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Approvals = () => {
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchPendingAdmins();
  }, []);

  const fetchPendingAdmins = async () => {
    try {
      setLoading(true);
      const res = await superAdminService.getPendingAdmins();
      setPendingAdmins(res.admins || res.data || []);
    } catch (error) {
      addToast('Failed to load pending approvals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this hospital?')) return;
    try {
      await superAdminService.approveUser(id);
      addToast('Hospital Admin approved successfully', 'success');
      fetchPendingAdmins();
    } catch (error) {
      addToast('Approval failed', 'error');
    }
  };

  const handleReject = async (id) => {
    // Basic mock rejection, normally you'd open a modal for rejection reason
    if (!window.confirm('Are you sure you want to REJECT this hospital?')) return;
    addToast('Rejection logic requires a dedicated endpoint. Coming soon.', 'info');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pending Approvals</h1>
        <p className="text-sm text-slate-500 mt-1">Review and approve new hospital registrations</p>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by hospital name..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <Button variant="secondary" className="sm:w-auto w-full">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hospital Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                // Skeletons
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-1/3 animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded w-24 ml-auto animate-pulse"></div></td>
                  </tr>
                ))
              ) : pendingAdmins.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <ShieldCheck className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900">No pending approvals right now 🎉</h3>
                    <p className="text-sm text-slate-500 mt-1">You're all caught up!</p>
                  </td>
                </tr>
              ) : (
                pendingAdmins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                          {admin.hospitalId?.hospitalName?.charAt(0) || 'H'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{admin.hospitalId?.hospitalName || 'N/A'}</div>
                          <div className="text-sm text-slate-500">ID: {admin._id.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 font-medium">{admin.firstName} {admin.lastName}</div>
                      <div className="text-sm text-slate-500">{admin.email}</div>
                      <div className="text-sm text-slate-500">{admin.mobile}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(admin.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => handleApprove(admin._id)} className="bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20">
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleReject(admin._id)} className="text-red-600 hover:bg-red-50 hover:border-red-100 border-slate-200">
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Approvals;
