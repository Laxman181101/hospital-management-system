import React, { useState, useEffect } from 'react';
import { ShieldCheck, Building2, Users, Activity, ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  hospital_admin: 'Hospital Admin',
  doctor: 'Doctor',
  patient: 'Patient',
  receptionist: 'Receptionist',
  pharmacist: 'Pharmacist',
  lab_technician: 'Lab Tech',
  nurse: 'Nurse',
  inventory_manager: 'Inventory Mgr',
  financial_manager: 'Finance Mgr',
};

const SuperAdminDashboard = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/v1/dashboard/super-admin/summary');
        
        if (res.data) {
          setSummary(res.data.data || res.data);
        }
        
        try {
          const adminsRes = await api.get('/api/v1/auth/pending-admins');
          setPendingApprovalsCount(adminsRes.data?.admins?.length || 0);
        } catch (err) {
          // Ignore if optional check fails
        }
      } catch (error) {
        console.error('Error fetching super admin dashboard data:', error);
        showToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [showToast]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <div className="space-y-3 w-64 mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  const {
    totalHospitals = 0,
    totalUsers = 0,
    platformUsage = { totalPatients: 0 },
    recentHospitals = [],
    patientGrowth = [],
    userDistribution = [],
  } = summary || {};

  const roleChartData = (userDistribution || []).map(item => ({
    name: ROLE_LABELS[item.role] || item.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    count: item.count || 0,
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor the health and growth of your SaaS platform</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Hospitals</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalHospitals}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Users</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalUsers}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Patients</p>
              <h3 className="text-2xl font-bold text-slate-900">{platformUsage.totalPatients}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-2 border-orange-100 bg-orange-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-600">Pending Approvals</p>
                <h3 className="text-2xl font-bold text-slate-900">{pendingApprovalsCount}</h3>
              </div>
            </div>
          </div>
          <Link to="/super-admin/approvals" className="mt-4 flex items-center text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors">
            Review Now <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Patient Growth Trend</h2>
          <div className="h-72 w-full">
            {patientGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={patientGrowth}>
                  <defs>
                    <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="count" name="Patients" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSignups)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={Activity} title="No Patient Data" description="Not enough data to show a trend yet." className="h-full bg-transparent border-none" />
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6">User Distribution</h2>
          <div className="h-72 w-full">
            {roleChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} interval={0} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                  <Tooltip
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#2dd4bf" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={Users} title="No User Data" description="No user distribution records found." className="h-full bg-transparent border-none" />
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Recent Hospitals</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {recentHospitals.length > 0 ? recentHospitals.map((hospital, idx) => (
            <div key={idx} className="p-4 sm:px-6 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
              <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                hospital.status === 'approved' ? 'bg-emerald-500' :
                hospital.status === 'pending' ? 'bg-orange-500' : 'bg-red-500'
              }`} />
              <div>
                <p className="text-sm font-medium text-slate-900">{hospital.hospitalName} ({hospital.email})</p>
                <div className="flex items-center text-xs text-slate-500 mt-1">
                  <Clock className="w-3 h-3 mr-1" /> Registered on {new Date(hospital.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-slate-500 text-sm">No recent hospital activity.</div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SuperAdminDashboard;
