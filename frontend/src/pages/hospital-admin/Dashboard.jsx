import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, Users, Stethoscope, BriefcaseMedical, 
  Clock, ChevronRight, Activity, MapPin, 
  Calendar, DollarSign, CalendarCheck, User
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import StarRating from '../../components/ui/StarRating';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { Star, Plus } from 'lucide-react';

const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444'
};

const HospitalAdminDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [hospital, setHospital] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch dashboard summary (this works using req.user.sub, so it doesn't strictly need user.hospitalId)
        const dashboardRes = await api.get('/api/v1/dashboard/hospital-admin/summary');
        
        if (dashboardRes.data) {
          setSummary(dashboardRes.data);
        }

        // Fetch hospital details separately if we have the ID
        if (user?.hospitalId) {
          try {
            const hospitalRes = await api.get(`/api/v1/hospitals/${user.hospitalId}`);
            if (hospitalRes.data?.data) {
              setHospital(hospitalRes.data.data);
            }
          } catch (hospError) {
            console.error('Error fetching hospital details:', hospError);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        addToast('error', 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, addToast]);

  const handleToggleStatus = async () => {
    if (window.confirm(`Are you sure you want to ${hospital.isActive ? 'deactivate' : 'activate'} your hospital listing?`)) {
      try {
        await api.patch(`/api/v1/hospitals/${hospital._id}/status`);
        setHospital(prev => ({ ...prev, isActive: !prev.isActive }));
        addToast('success', 'Hospital status updated successfully');
      } catch (error) {
        addToast('error', 'Failed to update status');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-end">
          <div className="space-y-3 w-64">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Time-aware greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const adminName = user?.firstName || user?.email?.split('@')[0] || 'Admin';
  
  // Format date
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Data processing from summary
  const totalPatients = summary?.totalPatients || 0;
  const totalAppointments = summary?.totalAppointments || 0;
  const totalDoctors = summary?.totalDoctors || 0;
  const totalRevenue = summary?.revenueSummary?.totalRevenue || 0;

  const appointmentStatsData = summary?.appointmentStats ? [
    { name: 'Pending', value: summary.appointmentStats.pending, color: STATUS_COLORS.pending },
    { name: 'Confirmed', value: summary.appointmentStats.confirmed, color: STATUS_COLORS.confirmed },
    { name: 'Completed', value: summary.appointmentStats.completed, color: STATUS_COLORS.completed },
    { name: 'Cancelled', value: summary.appointmentStats.cancelled, color: STATUS_COLORS.cancelled }
  ].filter(item => item.value > 0) : [];

  const revenueTrendData = summary?.revenueTrend || [];
  const recentAppointments = summary?.recentAppointments || [];
  const topDoctors = summary?.topDoctors || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight capitalize">
            {greeting}, {adminName} 👋
          </h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
            <span>{today}</span>
            {hospital && (
              <>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <div className="flex items-center gap-1.5 font-medium">
                  <Building2 size={14} className="text-slate-400" />
                  <span className="text-slate-700">{hospital.hospitalName}</span>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ml-2 ${hospital.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${hospital.isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {hospital.isActive ? 'Active' : 'Pending'}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Patients */}
        <Card className="relative overflow-hidden p-6 hover:shadow-md transition-shadow group cursor-default flex flex-col justify-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-indigo-400" />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 mb-1">Total Patients</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{totalPatients}</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform shadow-sm shadow-indigo-100">
              <Users size={24} />
            </div>
          </div>
        </Card>

        {/* Total Appointments */}
        <Card className="relative overflow-hidden p-6 hover:shadow-md transition-shadow group cursor-default flex flex-col justify-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-teal-400" />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 mb-1">Appointments</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{totalAppointments}</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform shadow-sm shadow-teal-100">
              <CalendarCheck size={24} />
            </div>
          </div>
        </Card>

        {/* Total Doctors */}
        <Card className="relative overflow-hidden p-6 hover:shadow-md transition-shadow group cursor-default flex flex-col justify-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 mb-1">Doctors</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{totalDoctors}</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-sm shadow-blue-100">
              <Stethoscope size={24} />
            </div>
          </div>
        </Card>

        {/* Total Revenue */}
        <Card className="relative overflow-hidden p-6 hover:shadow-md transition-shadow group cursor-default flex flex-col justify-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 mb-1">Total Revenue</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">₹{totalRevenue.toLocaleString()}</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shadow-sm shadow-emerald-100">
              <DollarSign size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Charts & Snapshot) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Donut Chart (Appointment Status) */}
            <Card className="p-6 h-[340px] flex flex-col">
              <h3 className="text-base font-bold text-slate-800 mb-4">Appointment Status</h3>
              <div className="flex-1 -ml-4">
                {appointmentStatsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={appointmentStatsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {appointmentStatsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '13px', fontWeight: '600' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                        formatter={(value) => <span className="text-slate-600 text-sm font-medium capitalize">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState 
                    icon={PieChart} 
                    title="No appointments" 
                    description="No appointment data available yet." 
                    className="h-full border-none bg-transparent"
                  />
                )}
              </div>
            </Card>

            {/* Line Chart (Revenue Trend) */}
            <Card className="p-6 h-[340px] flex flex-col">
              <h3 className="text-base font-bold text-slate-800 mb-6">Revenue Trend</h3>
              <div className="flex-1 -ml-6">
                {revenueTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} dx={-10} tickFormatter={(val) => `₹${val/1000}k`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}
                        itemStyle={{ color: '#0f172a', fontSize: '14px', fontWeight: 'bold' }}
                        formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                   <EmptyState 
                    icon={Activity} 
                    title="No revenue data" 
                    description="Revenue trend will appear once payments are collected." 
                    className="h-full border-none bg-transparent"
                  />
                )}
              </div>
            </Card>

          </div>

          {/* Hospital Snapshot Card */}
          {hospital && (
            <Card className="p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-60 pointer-events-none"></div>
              
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center relative z-10">
                <div className="w-24 h-24 bg-white rounded-2xl border-4 border-slate-50 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                  {hospital.logoUrl ? (
                    <img src={hospital.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Building2 className="text-indigo-200" size={40} />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold text-slate-900">{hospital.hospitalName}</h2>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-3">
                    <MapPin size={16} />
                    {hospital.address?.city || 'Location not set'}, {hospital.address?.state || ''}
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating rating={hospital.averageRating || 0} size={16} />
                    <span className="text-sm font-semibold text-slate-700">{hospital.averageRating ? hospital.averageRating.toFixed(1) : 'New'}</span>
                    <span className="text-xs text-slate-400">({hospital.totalReviews || 0} reviews)</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-4 w-full sm:w-auto">
                  <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 w-full sm:w-auto justify-between">
                    <span className="text-sm font-semibold text-slate-700">Status</span>
                    <button 
                      onClick={handleToggleStatus}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hospital.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hospital.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <Link to="/hospital-admin/profile" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group">
                    View Full Profile <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </Card>
          )}

        </div>

        {/* Right Column (Recent Appointments & Top Doctors) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Top Doctors */}
          <Card className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-800">Top Doctors</h3>
              <Star className="text-amber-400" size={18} fill="currentColor" />
            </div>

            <div className="flex-1">
              {topDoctors.length > 0 ? (
                <div className="space-y-4">
                  {topDoctors.map((doc, idx) => (
                    <div key={doc._id} className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        {doc.user?.profilePicture ? (
                          <img 
                            src={doc.user.profilePicture} 
                            alt={doc.name} 
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 border border-indigo-100">
                            {doc.name ? doc.name.charAt(0).toUpperCase() : 'D'}
                          </div>
                        )}
                        <div className="absolute -top-1 -left-1 w-4 h-4 bg-amber-400 text-white rounded-full flex items-center justify-center text-[9px] font-bold border border-white shadow-sm">
                          {idx + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{doc.name}</p>
                        <p className="text-xs text-slate-500 truncate">{doc.specialization}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-emerald-600">₹{doc.consultationFee}</p>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">{doc.experience} YRS</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={Stethoscope} 
                  title="No doctors found" 
                  description="Register doctors to see them ranked here."
                  className="py-8 border-none bg-transparent"
                />
              )}
            </div>
          </Card>

          {/* Recent Appointments */}
          <Card className="p-6 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-800">Recent Appointments</h3>
              <Calendar className="text-slate-400" size={18} />
            </div>

            <div className="flex-1">
              {recentAppointments.length > 0 ? (
                <div className="space-y-5 relative before:absolute before:inset-0 before:ml-[19px] before:h-full before:w-[2px] before:bg-slate-100">
                  {recentAppointments.map((appt) => (
                    <div key={appt._id} className="relative flex items-start gap-4 group">
                      {/* Icon */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-white bg-indigo-50 text-indigo-600 shadow-sm shrink-0 z-10">
                        <User size={16} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pt-1 pb-1">
                        <div className="flex flex-col mb-1">
                          <span className="font-semibold text-slate-800 text-sm">
                            {appt.patient?.name || 'Unknown Patient'}
                          </span>
                          <span className="text-xs text-slate-500">
                            with <span className="font-medium text-slate-700">{appt.doctor?.name || 'Doctor'}</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <time className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <Clock size={12} />
                            {new Date(appt.appointmentDate).toLocaleDateString()}
                          </time>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase" style={{ backgroundColor: `${STATUS_COLORS[appt.status]}20`, color: STATUS_COLORS[appt.status] }}>
                            {appt.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={Activity} 
                  title="All quiet here" 
                  description="Recent appointments will appear here."
                  className="py-8 border-none bg-transparent"
                />
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default HospitalAdminDashboard;
