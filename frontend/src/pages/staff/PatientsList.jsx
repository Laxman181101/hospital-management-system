import React, { useState, useEffect } from 'react';
import { Users, Search, Activity, UserPlus } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import DataTable from '../../components/ui/DataTable';
import { Link } from 'react-router-dom';

const PatientsList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/patients');
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'Patient Name',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0 text-sm">
            {(row.firstName?.charAt(0) || row.name?.charAt(0) || 'P').toUpperCase()}
          </div>
          <div>
            <span className="font-semibold text-slate-900 block">{row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim()}</span>
            <span className="text-xs text-slate-400">ID: {row._id?.slice(-6).toUpperCase()}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Contact Info',
      key: 'mobile',
      render: (row) => (
        <div>
          <div className="text-sm font-medium text-slate-700">{row.mobile || 'N/A'}</div>
          <div className="text-xs text-slate-400">{row.email || 'N/A'}</div>
        </div>
      )
    },
    {
      header: 'Gender & Age',
      key: 'gender',
      render: (row) => {
        const age = row.dateOfBirth
          ? new Date().getFullYear() - new Date(row.dateOfBirth).getFullYear()
          : null;
        return (
          <div>
            <span className="capitalize text-sm text-slate-700">{row.gender || 'Unknown'}</span>
            {age !== null && <span className="text-xs text-slate-400 block">{age} yrs</span>}
          </div>
        );
      }
    },
    {
      header: 'Blood Group',
      key: 'bloodGroup',
      render: (row) => (
        <Badge variant={row.bloodGroup ? 'info' : 'outline'}>
          {row.bloodGroup || '—'}
        </Badge>
      )
    },
    {
      header: 'Registration',
      key: 'registrationMethod',
      render: (row) => (
        <Badge variant={row.registrationMethod === 'manual' ? 'warning' : 'success'}>
          {row.registrationMethod === 'manual' ? 'Walk-in' : 'Online'}
        </Badge>
      )
    }
  ];

  // Client-side search
  const filteredPatients = patients.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = (p.name || `${p.firstName || ''} ${p.lastName || ''}`).toLowerCase();
    return (
      name.includes(q) ||
      (p.mobile || '').includes(q) ||
      (p.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="text-indigo-500 w-8 h-8" /> Patient Directory
          </h1>
          <p className="text-slate-500 mt-1 text-sm">View and manage all registered patients at this hospital.</p>
        </div>
        <Link
          to="/staff/register"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Register New Patient
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, mobile, or email..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
        />
      </div>

      {/* Table */}
      <Card className="p-0 border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Activity className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-4" />
            <p>Loading patient directory...</p>
          </div>
        ) : (
          <div className="h-[600px]">
            <DataTable
              columns={columns}
              data={filteredPatients}
              keyField="_id"
              emptyIcon={Users}
              emptyTitle="No Patients Found"
              emptyDescription={searchQuery ? `No patients match "${searchQuery}"` : 'No patients have been registered yet.'}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default PatientsList;
