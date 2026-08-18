import React, { useState, useEffect } from 'react';
import { Search, Filter, Mail, Building2, AlertCircle, RefreshCw } from 'lucide-react';
import { superAdminService } from '../../services/super-admin.service';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const CANONICAL_ROLES = [
  { value: '', label: 'All Roles' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'lab_technician', label: 'Lab Technician' },
  { value: 'inventory_manager', label: 'Inventory Manager' },
  { value: 'financial_manager', label: 'Financial Manager' },
];

const StaffDirectory = () => {
  const [staff, setStaff] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [search, roleFilter, hospitalFilter]);

  const fetchHospitals = async () => {
    try {
      const res = await superAdminService.getHospitals();
      // Handle response payload array vs object wrapper
      const list = Array.isArray(res) ? res : (res?.hospitals || res?.data || []);
      setHospitals(list);
    } catch (err) {
      console.error('Failed to load hospital list for filter:', err);
    }
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (hospitalFilter) params.hospitalId = hospitalFilter;

      const res = await superAdminService.getStaff(params);

      // Robust payload extraction supporting multiple backend response formats
      const staffList = res?.staff || res?.data?.staff || (Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []));
      setStaff(staffList);
    } catch (err) {
      console.error('Failed to load staff directory:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load platform staff directory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Staff Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Browse and manage doctors, nurses, and staff across all hospitals</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-800 text-sm">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-3 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchStaff}>
            <RefreshCw className="w-4 h-4 mr-1.5 animate-spin-hover" />
            Retry
          </Button>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-4 bg-white">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff by name or email..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {CANONICAL_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>

            <select
              value={hospitalFilter}
              onChange={(e) => setHospitalFilter(e.target.value)}
              className="border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 max-w-[200px] truncate"
            >
              <option value="">All Hospitals</option>
              {hospitals.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.hospitalName || h.name || h.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff Member</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hospital Affiliation</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-10 bg-slate-100 rounded w-full animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-16 animate-pulse"></div></td>
                  </tr>
                ))
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    No staff members found on the platform matching your criteria.
                  </td>
                </tr>
              ) : (
                staff.map((member) => {
                  const hospitalName = typeof member.hospitalId === 'object' && member.hospitalId !== null
                    ? (member.hospitalId.hospitalName || member.hospitalId.name || member.hospitalId.code || 'Hospital Affiliated')
                    : (typeof member.hospitalId === 'string' && member.hospitalId ? (member.hospitalName || 'Hospital Affiliated') : 'Platform Admin / Unassigned');

                  return (
                    <tr key={member._id} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-200 overflow-hidden">
                            {member.profilePicture ? (
                              <img src={member.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold bg-slate-100 border border-slate-200">
                                {member.firstName?.charAt(0) || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-slate-900">{member.firstName} {member.lastName}</div>
                            <div className="text-xs text-slate-500 flex items-center mt-0.5">
                              <Mail className="w-3 h-3 mr-1" /> {member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 capitalize border border-blue-100">
                          {member.role?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-slate-700">
                          <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                          {hospitalName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {member.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default StaffDirectory;
