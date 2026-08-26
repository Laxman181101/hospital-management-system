import React, { useState, useEffect } from 'react';
import { Users, Calendar, Activity, DollarSign, Clock, ChevronRight, Bed, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import TrendLineChart from '../../components/ui/TrendLineChart';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [ipdCount, setIpdCount] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(false);

        // Fetch doctor dashboard data
        const res = await api.get('/api/v1/dashboard/doctor/complete');
        setData(res.data.data || res.data);

        // Fetch today's appointments for this doctor
        const today = new Date().toISOString().split('T')[0];
        const [apptsRes, allApptsRes] = await Promise.all([
          api.get(`/api/v1/appointments/doctor?date=${today}`),
          api.get('/api/v1/appointments/doctor')
        ]);
        
        setTodayAppointments(apptsRes.data.data || []);
        
        const all = allApptsRes.data.data || [];
        setUpcomingAppointments(all);
        if ((apptsRes.data.data || []).length === 0 && all.length > 0) {
          setActiveTab('upcoming');
        }

        // Fetch IPD admitted patients for this doctor
        try {
          const ipdRes = await api.get('/api/v1/ward/admissions?status=Admitted');
          const admissions = ipdRes.data?.data || [];
          // Count where doctor matches current user
          const myIpd = admissions.filter(a =>
            a.primaryDoctor?._id === user?.sub || a.primaryDoctor === user?.sub
          );
          setIpdCount(myIpd.length);
        } catch (e) {}

      } catch (err) {
        console.error('Failed to fetch doctor dashboard', err);
        setError(true);
        try {
          const today = new Date().toISOString().split('T')[0];
          const allRes = await api.get('/api/v1/appointments/doctor');
          const all = allRes.data.data || [];
          setUpcomingAppointments(all);
          setTodayAppointments(all.filter(a => a.appointmentDate && a.appointmentDate.startsWith(today)));
        } catch (e2) {}
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const stats = [
    { label: "Today's Appointments", value: todayAppointments?.length || 0, icon: Calendar, color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Upcoming Bookings', value: upcomingAppointments?.length || 0, icon: Clock, color: 'bg-blue-100 text-blue-600' },
    { label: 'Total Patients', value: data?.patients?.totalPatients || 0, icon: Users, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'IPD Admitted', value: ipdCount || 0, icon: Bed, color: 'bg-purple-100 text-purple-600' },
  ];

  const chartData = data?.appointmentTrend || [];
  const displayList = (activeTab === 'today' ? todayAppointments : upcomingAppointments) || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome, Dr. {user?.firstName}!</h1>
          <p className="text-slate-500">Here's your schedule and overview for today.</p>
        </div>
      </div>

      {/* Error Banner (non-blocking) */}
      {error && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-sm">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p>Some dashboard stats could not be loaded. Your appointments are shown below.</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-6 flex items-center gap-4 hover:shadow-md transition-shadow cursor-default border border-transparent hover:border-slate-200">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${stat.color}`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{loading ? '-' : stat.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Schedule & Appointments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('today')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'today'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today's Schedule ({todayAppointments?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upcoming')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'upcoming'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Bookings ({upcomingAppointments?.length || 0})
              </button>
            </div>

            <Link to="/doctor/appointments" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Go to Full Calendar <ChevronRight size={14} />
            </Link>
          </div>

          <Card className="overflow-hidden border border-slate-100 shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-slate-500 animate-pulse">Loading schedule...</div>
            ) : (displayList && displayList.length > 0) ? (
              <div className="divide-y divide-slate-100">
                {displayList.map(appt => {
                  const isVirtual = ['video', 'chat', 'audio'].includes(appt.appointmentType || appt.type);
                  const isPaid = appt.paymentStatus === 'paid' || appt.paymentStatus === 'success';
                  const apptDateStr = appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
                  
                  return (
                    <div key={appt._id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          appt.appointmentType === 'video' ? 'bg-purple-100 text-purple-700' :
                          appt.appointmentType === 'chat' ? 'bg-amber-100 text-amber-700' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {appt.patient?.user?.firstName?.charAt(0) || appt.patient?.firstName?.charAt(0) || appt.patient?.name?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-sm">
                              {(appt.patient?.user ? `${appt.patient.user.firstName || ''} ${appt.patient.user.lastName || ''}`.trim() : '') ||
                               (appt.patient?.firstName ? `${appt.patient.firstName} ${appt.patient.lastName || ''}`.trim() : '') ||
                               appt.patient?.name ||
                               appt.patientName ||
                               'Patient'}
                            </h4>
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                              {appt.appointmentType || appt.type || 'physical'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                            <span className="font-medium text-slate-700">{apptDateStr}</span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1"><Clock size={12} className="text-indigo-400" /> {appt.startTime}</span>
                            <span className="text-slate-300">•</span>
                            <span className={`font-semibold ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {isPaid ? 'Fee Paid' : 'Payment Pending'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Badge status={appt.status} className="capitalize text-xs">{appt.status}</Badge>
                        <Link to={isVirtual ? "/doctor/consultations" : "/doctor/appointments"}>
                          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1.5 px-3 rounded-lg font-bold">
                            {appt.appointmentType === 'video' ? 'Video Room' : appt.appointmentType === 'chat' ? 'Chat Room' : 'Start Visit'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <Calendar className="text-slate-400" size={24} />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">
                  {activeTab === 'today' ? "No appointments today" : "No upcoming appointments"}
                </h3>
                <p className="text-slate-500 text-xs">
                  {activeTab === 'today' ? "You have a clear schedule for today." : "No upcoming visits are scheduled."}
                </p>
              </div>
            )}
          </Card>

          {/* IPD Patients shortcut */}
          {ipdCount > 0 && (
            <Link to="/doctor/consultations">
              <Card className="p-4 bg-purple-50 border border-purple-200 hover:shadow-md transition-all flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Bed className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900">{ipdCount} Patient{ipdCount > 1 ? 's' : ''} Admitted (IPD)</p>
                    <p className="text-xs text-purple-600">Click to view consultations & request discharge</p>
                  </div>
                </div>
                <ChevronRight className="text-purple-400" size={20} />
              </Card>
            </Link>
          )}
        </div>

        {/* Analytics / Side panel */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-800">Weekly Trend</h2>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-slate-500 mb-6">Appointments over the last 7 days</h3>
            <div className="h-64">
              {chartData.length > 0 ? (
                <TrendLineChart
                  data={chartData}
                  xKey="month"
                  yKey="count"
                  color="#4f46e5"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  No trend data available
                </div>
              )}
            </div>
          </Card>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Quick Actions</h3>
            <Link to="/doctor/consultations" className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all text-sm font-medium text-slate-700 hover:text-indigo-700">
              <Activity size={16} className="text-indigo-500" /> Start Consultation
            </Link>
            <Link to="/doctor/prescriptions" className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all text-sm font-medium text-slate-700 hover:text-indigo-700">
              <Users size={16} className="text-emerald-500" /> Write Prescription
            </Link>
            <Link to="/doctor/surgeries" className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all text-sm font-medium text-slate-700 hover:text-indigo-700">
              <Calendar size={16} className="text-purple-500" /> View OT Schedule
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;

