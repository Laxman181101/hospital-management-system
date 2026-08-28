import React, { useState, useEffect } from 'react';
import { Activity, Clock, LogIn, LogOut, CalendarCheck, Calendar, UserPlus, Receipt, Search, FileText, CheckCircle, XCircle, CreditCard, Eye, Bed } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Link, useNavigate } from 'react-router-dom';

const StaffDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [fetchingAppts, setFetchingAppts] = useState(true);
  const [attendanceStatus, setAttendanceStatus] = useState('unknown'); 
  const [checkInTime, setCheckInTime] = useState(null);
  
  const [allAppointments, setAllAppointments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [viewScope, setViewScope] = useState('today'); // 'today' or 'all'
  const [filterTab, setFilterTab] = useState('All');
  
  const [stats, setStats] = useState({
    todayCount: 0,
    allCount: 0,
    pendingConfirmations: 0,
    pendingCheckIns: 0,
    walkInsToday: 0,
    pendingBills: 0,
    pendingDischargeBills: 0,
    pendingDischargeRequests: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const baseList = viewScope === 'today' ? appointments : allAppointments;
    if (filterTab === 'All') setFilteredAppointments(baseList);
    else if (filterTab === 'Pending') setFilteredAppointments(baseList.filter(a => a.status === 'pending'));
    else if (filterTab === 'Confirmed') setFilteredAppointments(baseList.filter(a => a.status === 'confirmed'));
    else if (filterTab === 'Completed') setFilteredAppointments(baseList.filter(a => a.status === 'completed'));
  }, [filterTab, viewScope, appointments, allAppointments]);

  const fetchDashboardData = async () => {
    setFetchingAppts(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get(`/api/v1/appointments`);
      const allAppts = res.data.data || [];
      
      const todayAppts = allAppts.filter(a => {
        if (!a.appointmentDate) return false;
        return a.appointmentDate.split('T')[0] === today;
      });

      setAppointments(todayAppts);
      setAllAppointments(allAppts);

      if (todayAppts.length === 0 && allAppts.length > 0) {
        setViewScope('all');
      }
      
      // Compute stats
      setStats({
        todayCount: todayAppts.length,
        allCount: allAppts.length,
        pendingConfirmations: allAppts.filter(a => a.status === 'pending').length,
        pendingCheckIns: todayAppts.filter(a => a.status === 'confirmed').length,
        walkInsToday: todayAppts.filter(a => a.bookingMode === 'walk-in').length,
        pendingBills: allAppts.filter(a => a.paymentStatus === 'pending' || a.paymentStatus === 'unpaid').length,
        pendingDischargeBills: 0,
        pendingDischargeRequests: 0
      });
      
      try {
        const billRes = await api.get('/api/v1/billing');
        const bills = billRes.data?.data || [];
        const pendingIPDBills = bills.filter(b => b.admission && (b.paymentStatus === 'unpaid' || b.paymentStatus === 'partially_paid')).length;
        
        const admissionsRes = await api.get('/api/v1/ward/admissions');
        const admissions = admissionsRes.data?.data || [];
        const pendingDischargeRequests = admissions.filter(a => a.status === 'Discharge Requested').length;

        setStats(s => ({...s, pendingDischargeBills: pendingIPDBills, pendingDischargeRequests}));
      } catch(e) {}

    } catch (err) {
      console.error(err);
      showToast('Failed to fetch appointments', 'error');
    } finally {
      setFetchingAppts(false);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      await api.post('/api/v1/attendance/check-in');
      showToast('Checked in successfully', 'success');
      setAttendanceStatus('checked_in');
      setCheckInTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to check in', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      await api.post('/api/v1/attendance/check-out');
      showToast('Checked out successfully', 'success');
      setAttendanceStatus('checked_out');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to check out', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReportDelay = async () => {
    setLoading(true);
    try {
      await api.post('/api/v1/attendance/delay', { reason: 'Running late due to traffic' });
      showToast('Delay reported successfully', 'success');
    } catch (err) {
      showToast('Failed to report delay', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/api/v1/appointments/${id}/status`, { status });
      showToast(`Status updated to ${status}`, 'success');
      fetchDashboardData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-teal-600" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900 capitalize">{user?.role?.replace('_', ' ')} Workspace</h1>
            <p className="text-slate-500">Welcome back, {user?.firstName || 'Staff'}. Here's what's happening today.</p>
          </div>
        </div>
        <p className="text-slate-600 font-medium">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
        <Card 
          className="p-6 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all"
          onClick={() => { setViewScope('today'); setFilterTab('All'); }}
        >
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Today's Appts</p>
            <p className="text-2xl font-bold text-slate-900">{stats.todayCount}</p>
          </div>
        </Card>
        
        <Card 
          className={`p-6 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all ${stats.pendingConfirmations > 0 ? 'bg-amber-50/60 border border-amber-200' : ''}`}
          onClick={() => { setViewScope('all'); setFilterTab('Pending'); }}
        >
          <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Pending Confirm</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pendingConfirmations}</p>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4">
          <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
            <UserPlus size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Walk-ins Today</p>
            <p className="text-2xl font-bold text-slate-900">{stats.walkInsToday}</p>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-lg text-red-600">
            <Receipt size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Pending Bills</p>
            <p className="text-2xl font-bold text-slate-900">{stats.pendingBills}</p>
          </div>
        </Card>
        
        <Card className="p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left bg-teal-50/50 border border-teal-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/staff/billing')}>
          <div className="p-3 bg-teal-100 rounded-lg text-teal-700">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-teal-800 font-medium">IPD Bills</p>
            <p className="text-xl sm:text-2xl font-bold text-teal-900">{stats.pendingDischargeBills}</p>
          </div>
        </Card>

        {/* New Pending Discharge Requests Card */}
        <Card 
          className={`p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left cursor-pointer hover:shadow-md transition-all border-2 ${
            stats.pendingDischargeRequests > 0 
              ? 'bg-red-50 border-red-400 shadow-red-100/50 animate-pulse' 
              : 'bg-white border-slate-200'
          }`} 
          onClick={() => navigate('/staff/ward-management')}
        >
          <div className={`p-3 rounded-lg ${stats.pendingDischargeRequests > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
            <Bed size={24} />
          </div>
          <div>
            <p className={`text-xs sm:text-sm font-medium ${stats.pendingDischargeRequests > 0 ? 'text-red-800' : 'text-slate-500'}`}>
              Pending Discharges
            </p>
            <p className={`text-xl sm:text-2xl font-bold ${stats.pendingDischargeRequests > 0 ? 'text-red-900' : 'text-slate-900'}`}>
              {stats.pendingDischargeRequests}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Card: Appointments (left 2/3) */}
        <Card className="p-0 overflow-hidden lg:col-span-2 flex flex-col h-full border border-slate-200">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setViewScope('today')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewScope === 'today'
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today's Schedule ({stats.todayCount})
              </button>
              <button
                type="button"
                onClick={() => setViewScope('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewScope === 'all'
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Bookings ({stats.allCount})
              </button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-lg">
              {['All', 'Pending', 'Confirmed', 'Completed'].map(tab => (
                <button
                  key={tab}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filterTab === tab ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  onClick={() => setFilterTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          <div className="overflow-x-auto flex-1 bg-slate-50/50">
            {fetchingAppts ? (
              <div className="p-8 text-center text-slate-500">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-200 rounded mx-6"></div>)}
                </div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <CalendarCheck size={48} className="text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">
                  {viewScope === 'today' ? 'No appointments scheduled for today' : 'No bookings found in this category'}
                </p>
                {viewScope === 'today' && stats.allCount > 0 && (
                  <button
                    onClick={() => setViewScope('all')}
                    className="mt-3 text-xs font-bold text-teal-700 hover:underline"
                  >
                    View All Upcoming Bookings ({stats.allCount})
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Patient & Doctor</th>
                    <th className="px-6 py-4">Status & Type</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredAppointments.map(app => (
                    <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 text-sm">
                          {app.appointmentDate ? new Date(app.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}
                        </div>
                        <div className="text-xs text-slate-500">{app.startTime} {app.endTime ? `- ${app.endTime}` : ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{app.patient?.name || (app.patient?.firstName ? app.patient.firstName + ' ' + app.patient.lastName : 'Unknown')}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          Dr. {app.doctor?.name || (app.doctor?.user?.firstName ? app.doctor.user.firstName + ' ' + app.doctor.user.lastName : '')}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <Badge variant={app.status === 'pending' ? 'warning' : app.status === 'confirmed' ? 'info' : app.status === 'completed' ? 'success' : 'danger'}>
                            {app.status}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {app.appointmentType || app.type || 'physical'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={app.paymentStatus === 'paid' ? 'success' : 'danger'}>
                          {app.paymentStatus || 'pending'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button title="View Details" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors tooltip-trigger" onClick={() => navigate('/staff/appointments')}>
                            <Eye size={18} />
                          </button>
                          {app.status === 'pending' && (
                            <button title="Confirm / Mark Arrived" className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" onClick={() => handleUpdateStatus(app._id, 'confirmed')}>
                              <CheckCircle size={18} />
                            </button>
                          )}
                          {(app.paymentStatus === 'pending' || !app.paymentStatus) && (
                            <button title="Collect Payment" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => navigate('/staff/billing')}>
                              <CreditCard size={18} />
                            </button>
                          )}
                          {(app.status === 'pending' || app.status === 'confirmed') && (
                            <button title="Cancel" className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" onClick={() => handleUpdateStatus(app._id, 'cancelled')}>
                              <XCircle size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          {/* Attendance Widget (right 1/3) */}
          <Card className="p-6 border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Clock size={100} />
            </div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                My Attendance
              </h2>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${attendanceStatus === 'checked_in' ? 'bg-green-500' : attendanceStatus === 'checked_out' ? 'bg-red-500' : 'bg-slate-300'}`}></div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {attendanceStatus.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-slate-500 mb-6 relative z-10">Mark your daily presence to keep operational records up to date.</p>
            
            <div className="space-y-4 relative z-10">
              <Button 
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 h-12" 
                onClick={handleCheckIn}
                disabled={loading || attendanceStatus === 'checked_in'}
              >
                <LogIn size={18} /> {attendanceStatus === 'checked_in' && checkInTime ? `Checked In at ${checkInTime}` : 'Check In'}
              </Button>
              <div className="flex gap-2">
                <Button 
                  className="flex-1 flex items-center justify-center gap-2 h-11" 
                  variant="outline"
                  onClick={handleCheckOut}
                  disabled={loading || attendanceStatus === 'checked_out' || attendanceStatus === 'unknown'}
                >
                  <LogOut size={16} /> Check Out
                </Button>
                <Button 
                  className="flex-1 flex items-center justify-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50 h-11" 
                  variant="outline"
                  onClick={handleReportDelay}
                  disabled={loading || attendanceStatus === 'checked_in'}
                >
                  <Clock size={16} /> Report Delay
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 mt-8">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/staff/register" className="block group">
              <Card className="p-4 flex items-center justify-between border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                    <UserPlus size={20} />
                  </div>
                  <span className="font-medium text-slate-700 group-hover:text-teal-700">Register Walk-in Patient</span>
                </div>
              </Card>
            </Link>
            
            <Link to="/staff/appointments" className="block group">
              <Card className="p-4 flex items-center justify-between border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                    <CalendarCheck size={20} />
                  </div>
                  <span className="font-medium text-slate-700 group-hover:text-teal-700">Book Appointment</span>
                </div>
              </Card>
            </Link>

            <Link to="/staff/ward-management" className="block group">
              <Card className="p-4 flex items-center justify-between border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <Bed size={20} />
                  </div>
                  <span className="font-medium text-slate-700 group-hover:text-indigo-700">Ward Management</span>
                </div>
              </Card>
            </Link>

            <Link to="/staff/billing" className="block group">
              <Card className="p-4 flex items-center justify-between border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                    <Receipt size={20} />
                  </div>
                  <span className="font-medium text-slate-700 group-hover:text-teal-700">Collect Payment</span>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
