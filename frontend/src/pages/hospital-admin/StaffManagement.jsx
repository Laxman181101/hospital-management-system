import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, Stethoscope, Mail, Phone, 
  MoreVertical, Eye, Edit2, Trash2, Shield, CheckCircle2, Ban, Loader2,
  X, BriefcaseMedical, FlaskConical
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

// Modals
import RegisterStaffModal from './RegisterStaffModal';
import StaffDetailDrawer from './StaffDetailDrawer';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

const StaffManagement = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const [deactivateModal, setDeactivateModal] = useState({ isOpen: false, staffId: null, staffName: '' });
  const [deactivateReason, setDeactivateReason] = useState('');
  
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, staffId: null, staffName: '' });
  const [deleteReason, setDeleteReason] = useState('');
  
  const [openActionMenu, setOpenActionMenu] = useState(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openActionMenu && !event.target.closest('.action-menu-container')) {
        setOpenActionMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openActionMenu]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/auth/staff');
      setStaffList(res.data.staff || []);
    } catch (error) {
      console.error('Failed to load staff:', error);
      addToast('Failed to load staff list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleToggleStatus = async (staffId, currentStatus, staffName = 'Staff') => {
    if (currentStatus === true) {
      // Active -> Inactive (Deactivate)
      setDeactivateModal({ isOpen: true, staffId, staffName });
      setDeactivateReason('');
    } else {
      // Inactive -> Active (Activate)
      try {
        await api.patch(`/api/v1/auth/staff/${staffId}`, { isApproved: true, deactivationReason: '' });
        addToast(`Staff activated successfully`, 'success');
        fetchStaff();
        if (selectedStaff && selectedStaff._id === staffId) {
          setSelectedStaff({ ...selectedStaff, isApproved: true });
        }
      } catch (error) {
        addToast('Failed to update status', 'error');
      }
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateReason.trim()) {
      addToast('Please provide a reason for deactivation', 'error');
      return;
    }
    try {
      await api.patch(`/api/v1/auth/staff/${deactivateModal.staffId}`, { isApproved: false, deactivationReason: deactivateReason });
      addToast(`Staff deactivated successfully`, 'success');
      fetchStaff();
      if (selectedStaff && selectedStaff._id === deactivateModal.staffId) {
        setSelectedStaff({ ...selectedStaff, isApproved: false });
      }
      setDeactivateModal({ isOpen: false, staffId: null, staffName: '' });
    } catch (error) {
      addToast('Failed to deactivate staff', 'error');
    }
  };

  const handleDelete = (staffId, staffName) => {
    setDeleteModal({ isOpen: true, staffId, staffName });
    setDeleteReason('');
  };

  const confirmDelete = async () => {
    if (!deleteReason.trim()) {
      addToast('Please provide a reason for deletion', 'error');
      return;
    }
    try {
      await api.delete(`/api/v1/auth/staff/${deleteModal.staffId}`, { data: { deletionReason: deleteReason } });
      addToast('Staff removed successfully', 'success');
      if (selectedStaff && selectedStaff._id === deleteModal.staffId) setShowDrawer(false);
      fetchStaff();
      setDeleteModal({ isOpen: false, staffId: null, staffName: '' });
    } catch (error) {
      addToast('Failed to delete staff', 'error');
    }
  };

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || s.role === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'Active' ? s.isApproved : !s.isApproved);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedStaff = [...filteredStaff].sort((a, b) => {
    if (sortField === 'createdAt') {
      return sortDirection === 'desc' 
        ? new Date(b.createdAt) - new Date(a.createdAt) 
        : new Date(a.createdAt) - new Date(b.createdAt);
    }
    const valA = a[sortField]?.toString().toLowerCase() || '';
    const valB = b[sortField]?.toString().toLowerCase() || '';
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedStaff.length / itemsPerPage);
  const paginatedStaff = sortedStaff.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'doctor': return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Doctor</span>;
      case 'receptionist': return <span className="px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-semibold">Receptionist</span>;
      case 'pharmacist': return <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">Pharmacist</span>;
      case 'lab_technician': return <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">Lab Tech</span>;
      default: return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">{role.replace('_', ' ')}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex-1 relative overflow-hidden h-full flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Staff</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            Manage your hospital's team <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">{staffList.length} Total</span>
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowRegisterModal(true)} className="gap-2 shadow-md shadow-indigo-200">
          <Plus size={18} /> Register New Staff
        </Button>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white shrink-0">
          
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-40">
              <select 
                className="w-full appearance-none pl-4 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="All">All Roles</option>
                <option value="Doctor">Doctors</option>
                <option value="Receptionist">Receptionists</option>
                <option value="Pharmacist">Pharmacists</option>
                <option value="Lab_Technician">Lab Technicians</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            
            <div className="relative flex-1 lg:w-36">
              <select 
                className="w-full appearance-none pl-4 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr className="border-b border-slate-200 shadow-sm">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('firstName')}>
                  <div className="flex items-center gap-1">Staff Member <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('role')}>
                  <div className="flex items-center gap-1">Role & Specialty <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('isApproved')}>
                  <div className="flex items-center gap-1">Status <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><Skeleton variant="circular" width="40px" height="40px" /><Skeleton variant="text" width="120px" height="16px" /></div></td>
                    <td className="px-6 py-4"><Skeleton variant="rectangular" width="96px" height="24px" className="rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton variant="text" width="160px" height="16px" /></td>
                    <td className="px-6 py-4"><Skeleton variant="rectangular" width="64px" height="24px" className="rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton variant="rectangular" width="80px" height="32px" className="ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedStaff.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <EmptyState 
                      icon={Users} 
                      title="No staff members found" 
                      description={searchQuery || roleFilter !== 'All' ? 'Try adjusting your search or filters.' : 'Get started by adding your first team member.'} 
                      actionLabel={!(searchQuery || roleFilter !== 'All') ? 'Register Staff' : undefined}
                      onAction={() => setShowRegisterModal(true)}
                      className="border-none bg-transparent"
                    />
                  </td>
                </tr>
              ) : (
                paginatedStaff.map((staff) => (
                  <tr key={staff._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedStaff(staff); setShowDrawer(true); }}>
                        <div className="w-10 h-10 rounded-full border border-slate-200 shadow-sm overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                          {staff.profilePicture ? (
                            <img src={staff.profilePicture} alt={staff.firstName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-slate-500 font-bold uppercase">{staff.firstName.charAt(0)}{staff.lastName?.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {staff.role === 'doctor' ? 'Dr. ' : ''}{staff.firstName} {staff.lastName}
                          </div>
                          <div className="text-xs text-slate-500">Added {new Date(staff.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        {getRoleBadge(staff.role)}
                        {staff.specialization && <span className="text-xs font-medium text-slate-500 mt-1 truncate max-w-[150px]">{staff.specialization}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm text-slate-600">
                        <span className="flex items-center gap-1.5"><Mail size={12} className="text-slate-400" /> {staff.email}</span>
                        <span className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400" /> {staff.mobile}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        staff.isApproved ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {staff.isApproved ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                        {staff.isApproved ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block text-left action-menu-container">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionMenu(openActionMenu === staff._id ? null : staff._id);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        {openActionMenu === staff._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-50 animate-scale-in origin-top-right overflow-hidden">
                            <div className="py-1">
                              <button
                                onClick={() => { setOpenActionMenu(null); setSelectedStaff(staff); setShowDrawer(true); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                              >
                                <Eye size={16} className="text-slate-400" /> View Profile
                              </button>
                              
                              <button
                                onClick={() => { setOpenActionMenu(null); handleToggleStatus(staff._id, staff.isApproved, staff.firstName); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                              >
                                {staff.isApproved ? (
                                  <><Ban size={16} className="text-warning" /> Deactivate Staff</>
                                ) : (
                                  <><CheckCircle2 size={16} className="text-success" /> Activate Staff</>
                                )}
                              </button>
                              
                              <div className="border-t border-slate-100 my-1"></div>
                              
                              <button
                                onClick={() => { setOpenActionMenu(null); handleDelete(staff._id, staff.firstName); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-danger hover:bg-danger/5 flex items-center gap-2 transition-colors font-medium"
                              >
                                <Trash2 size={16} className="text-danger" /> Delete Staff
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-slate-900">{Math.min(currentPage * itemsPerPage, sortedStaff.length)}</span> of <span className="font-medium text-slate-900">{sortedStaff.length}</span> results
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                className="px-2 py-1 h-8"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                className="px-2 py-1 h-8"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modals & Drawers */}
      {showRegisterModal && (
        <RegisterStaffModal 
          onClose={() => setShowRegisterModal(false)} 
          onSuccess={() => { setShowRegisterModal(false); fetchStaff(); }} 
        />
      )}
      
      {showDrawer && selectedStaff && (
        <StaffDetailDrawer 
          staff={selectedStaff} 
          onClose={() => setShowDrawer(false)}
          onToggleStatus={() => handleToggleStatus(selectedStaff._id, selectedStaff.isApproved, selectedStaff.firstName)}
          onDelete={() => handleDelete(selectedStaff._id, selectedStaff.firstName)}
        />
      )}

      {/* Deactivate Confirmation Modal */}
      {deactivateModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Deactivate Staff</h3>
              <button onClick={() => setDeactivateModal({ isOpen: false, staffId: null, staffName: '' })} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Are you sure you want to deactivate <span className="font-bold text-slate-900">{deactivateModal.staffName}</span>? They will no longer be able to log in.
              </p>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason for Deactivation *</label>
                <textarea
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  placeholder="E.g., On long leave, disciplinary action, etc."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none"
                  rows={3}
                ></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeactivateModal({ isOpen: false, staffId: null, staffName: '' })}>
                Cancel
              </Button>
              <Button variant="primary" onClick={confirmDeactivate} className="bg-warning hover:bg-warning/90 border-transparent text-white shadow-md shadow-warning/20">
                Confirm & Deactivate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Delete Staff</h3>
              <button onClick={() => setDeleteModal({ isOpen: false, staffId: null, staffName: '' })} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Are you sure you want to permanently delete <span className="font-bold text-slate-900">{deleteModal.staffName}</span>? This action cannot be undone.
              </p>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason for Deletion *</label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="E.g., Resigned, duplicate entry, etc."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none"
                  rows={3}
                ></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteModal({ isOpen: false, staffId: null, staffName: '' })}>
                Cancel
              </Button>
              <Button variant="primary" onClick={confirmDelete} className="bg-danger hover:bg-danger/90 border-transparent text-white shadow-md shadow-danger/20">
                Confirm & Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
