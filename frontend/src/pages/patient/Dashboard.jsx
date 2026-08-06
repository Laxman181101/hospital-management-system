import React, { useState, useEffect } from 'react';
import { User, Calendar, Clock, Activity, FileText, ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch appointments to show upcoming ones
        const res = await api.get('/api/v1/appointments/my');
        const allAppts = res.data.data || [];
        // Filter future appointments (status pending/confirmed)
        const upcoming = allAppts
          .filter(a => ['pending', 'confirmed'].includes(a.status))
          .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
          .slice(0, 3);
        setAppointments(upcoming);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const stats = [
    { label: 'Upcoming Appointments', value: appointments.length, icon: Calendar, color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Pending Reports', value: 0, icon: FileText, color: 'bg-amber-100 text-amber-600' },
    { label: 'Active Prescriptions', value: 'View', icon: Activity, color: 'bg-emerald-100 text-emerald-600', link: '/patient/prescriptions' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold">
            {user?.firstName?.charAt(0) || 'P'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.firstName || 'Patient'}!</h1>
            <p className="text-slate-500">Here's your health overview for today.</p>
          </div>
        </div>
        <Link to="/patient/book-appointment">
          <Button className="flex items-center gap-2 shadow-md shadow-indigo-200">
            <Calendar size={16} /> Book New Visit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${stat.color}`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              {stat.link ? (
                <Link to={stat.link} className="text-2xl font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                  {stat.value}
                </Link>
              ) : (
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Upcoming Appointments</h2>
            <Link to="/patient/appointments" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              View All <ChevronRight size={16} />
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse flex flex-col gap-4">
                {[1, 2].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl w-full"></div>)}
              </div>
            ) : appointments.length > 0 ? (
              appointments.map(appt => (
                <Card key={appt._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-indigo-500">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 font-bold">
                      {appt.doctor?.user?.firstName?.charAt(0) || 'D'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Dr. {appt.doctor?.user?.firstName} {appt.doctor?.user?.lastName}</h3>
                      <p className="text-sm text-slate-500">{appt.doctor?.specialization}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-600">
                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                          <Clock size={12} className="text-indigo-600" /> {new Date(appt.appointmentDate).toLocaleDateString()} at {appt.startTime}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md capitalize">
                          {appt.appointmentType === 'physical' ? <MapPin size={12} className="text-emerald-600" /> : <Activity size={12} className="text-blue-600" />}
                          {appt.appointmentType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-4 sm:pt-0">
                    <Badge status={appt.status}>{appt.status}</Badge>
                    <Link to="/patient/consultations">
                      <Button variant="outline" className="text-xs py-1.5 px-3 h-auto">Join / View</Button>
                    </Link>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
                  <Calendar className="text-slate-400" size={24} />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">No upcoming visits</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto mb-4">You have no upcoming appointments. Schedule one to stay on top of your health.</p>
                <Link to="/patient/book-appointment">
                  <Button variant="outline">Book Appointment</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-800">Quick Actions</h2>
          <Card className="overflow-hidden">
            <div className="divide-y divide-slate-100">
              {[
                { label: 'Upload Medical Report', desc: 'Add test results to your file', path: '/patient/records' },
                { label: 'View Prescriptions', desc: 'Check medication schedules', path: '/patient/prescriptions' },
                { label: 'Make a Payment', desc: 'Settle outstanding bills', path: '/patient/payments' },
              ].map((action, idx) => (
                <Link key={idx} to={action.path} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                  <div>
                    <h4 className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">{action.label}</h4>
                    <p className="text-xs text-slate-500">{action.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
