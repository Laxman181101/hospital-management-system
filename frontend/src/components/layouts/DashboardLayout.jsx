import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { 
  Activity, 
  Users, 
  ShieldCheck, 
  UserPlus, 
  User,
  LogOut,
  Settings,
  Menu,
  X,
  Building2,
  BarChart3,
  Bell,
  Search,
  LayoutDashboard,
  ChevronDown,
  Clock,
  CalendarOff,
  Bed,
  Pill,
  Package,
  DollarSign,
  FileText,
  Truck,
  Check,
  Calendar,
  Video,
  CreditCard,
  Stethoscope
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { superAdminService } from '../../services/super-admin.service';
import api from '../../services/api';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [hospital, setHospital] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const res = await api.get('/api/v1/notifications/my-notifications');
          setNotifications(res.data.data || []);
        } catch (error) {
          console.error('Failed to fetch notifications');
        }
      };
      fetchNotifications();
    }
  }, [user, location.pathname]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/api/v1/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Failed to mark notification as read');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    // If super admin, fetch pending count for the notification badge
    if (user?.role === 'super_admin') {
      const fetchPendingCount = async () => {
        try {
          const res = await superAdminService.getPendingAdmins();
          setPendingCount(res.data?.length || 0);
        } catch (error) {
          console.error('Failed to fetch pending count');
        }
      };
      fetchPendingCount();
    }
    
    // If hospital admin, fetch hospital details
    if (user?.role === 'hospital_admin' && user?.hospitalId) {
      const fetchHospital = async () => {
        try {
          const res = await api.get(`/api/v1/hospitals/${user.hospitalId}`);
          setHospital(res.data.data);
        } catch (error) {
          console.error('Failed to fetch hospital');
        }
      };
      fetchHospital();
    }
  }, [user?.role, user?.hospitalId, location.pathname]); // Re-fetch occasionally or on route change

  const roleMenus = {
    super_admin: [
      { name: 'Overview', path: '/super-admin', icon: LayoutDashboard },
      { name: 'Pending Approvals', path: '/super-admin/approvals', icon: ShieldCheck, badge: pendingCount },
      { name: 'Hospitals', path: '/super-admin/hospitals', icon: Building2 },
      { name: 'Staff Directory', path: '/super-admin/staff', icon: Users },
      { name: 'Analytics', path: '/super-admin/analytics', icon: BarChart3 },
      { name: 'Announcements', path: '/super-admin/announcements', icon: Bell },
      { name: 'Settings', path: '/super-admin/settings', icon: Settings },
    ],
    hospital_admin: [
      { name: 'Overview', path: '/hospital-admin', icon: LayoutDashboard },
      { name: 'My Hospital', path: '/hospital-admin/profile', icon: Building2 },
      { name: 'Staff Management', path: '/hospital-admin/staff', icon: Users },
      { name: 'Attendance', path: '/hospital-admin/attendance', icon: Clock },
      { name: 'Staff Leave', path: '/hospital-admin/staff-leave', icon: CalendarOff },
      { name: 'Ward Management', path: '/hospital-admin/ward-management', icon: Bed },
      { name: 'Pharmacy', path: '/hospital-admin/pharmacy', icon: Pill },
      { name: 'Laboratory', path: '/hospital-admin/laboratory', icon: Activity },
      { name: 'Inventory', path: '/hospital-admin/inventory', icon: Package },
      { name: 'Finance', path: '/hospital-admin/finance', icon: DollarSign },
      { name: 'Billing', path: '/hospital-admin/billing', icon: FileText },
      { name: 'Ambulance', path: '/hospital-admin/ambulance', icon: Truck },
    ],
    doctor: [
      { name: 'Dashboard', path: '/doctor', icon: LayoutDashboard },
      { name: 'My Appointments', path: '/doctor/appointments', icon: Calendar },
      { name: 'Consultation History', path: '/doctor/consultations', icon: Video },
      { name: 'Admissions/IPD', path: '/doctor/admissions', icon: Bed },
      { name: 'Surgeries/OT', path: '/doctor/surgeries', icon: Activity },
      { name: 'My Profile', path: '/doctor/profile', icon: User },
    ],
    patient: [
      { name: 'Dashboard', path: '/patient', icon: LayoutDashboard },
      { name: 'Book Appointment', path: '/patient/book-appointment', icon: Calendar },
      { name: 'My Appointments', path: '/patient/appointments', icon: Clock },
      { name: 'Medical Records', path: '/patient/records', icon: FileText },
      { name: 'Prescriptions', path: '/patient/prescriptions', icon: Pill },
      { name: 'Consultations', path: '/patient/consultations', icon: Video },
      { name: 'Payments', path: '/patient/payments', icon: CreditCard },
      { name: 'My Profile', path: '/patient/profile', icon: User },
    ],
    receptionist: [
      { name: 'Dashboard', path: '/staff', icon: LayoutDashboard },
      { name: 'Patients', path: '/staff/patients', icon: Users },
      { name: 'Appointments', path: '/staff/appointments', icon: Calendar },
      { name: 'Register Patient', path: '/staff/register', icon: UserPlus },
      { name: 'OT Scheduling', path: '/staff/ot', icon: Activity },
      { name: 'Ward Management', path: '/staff/ward-management', icon: Bed },
      { name: 'Doctor Schedules', path: '/staff/doctor-schedules', icon: Stethoscope },
      { name: 'Billing', path: '/staff/billing', icon: FileText },
    ],
    lab_technician: [
      { name: 'Dashboard', path: '/staff', icon: LayoutDashboard },
      { name: 'Test Catalog', path: '/staff/lab/tests', icon: Activity },
      { name: 'Test Requests', path: '/staff/lab/requests', icon: FileText },
    ],
    pharmacist: [
      { name: 'Dashboard', path: '/pharmacist', icon: LayoutDashboard },
      { name: 'Inventory', path: '/pharmacist/inventory', icon: Package },
      { name: 'Orders', path: '/pharmacist/orders', icon: FileText },
    ],
  };

  const navItems = user?.role ? roleMenus[user.role] || [] : [];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            {hospital?.logoUrl ? (
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-0.5 shadow-sm">
                <img src={hospital.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                <Activity className="w-5 h-5" />
              </div>
            )}
            <span className="text-xl font-bold text-slate-900 tracking-tight truncate">
              {hospital ? hospital.hospitalName : 'HealthSaaS'}
            </span>
          </div>
          <button 
            className="ml-auto lg:hidden text-slate-500 hover:text-slate-900"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems?.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/super-admin' || item.path === '/hospital-admin'}
                className={({ isActive }) => 
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/50' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex items-center">
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </div>
                {item.badge > 0 && (
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {user?.role === 'hospital_admin' && hospital && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${hospital.isActive ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'}`}></div>
              <span className="text-xs font-semibold text-slate-600">
                {hospital.isActive ? 'Active & Visible' : 'Inactive (Hidden)'}
              </span>
            </div>
          </div>
        )}
        
        <div className="p-4 border-t border-slate-200 shrink-0">
          <button 
            onClick={logout}
            className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 glass-header flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30">
          <div className="flex items-center flex-1">
            <button 
              className="lg:hidden text-slate-500 hover:text-slate-900 mr-4"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Search Bar */}
            <div className="hidden sm:flex max-w-md w-full relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-colors"
                placeholder="Search..."
              />
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 ml-4">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5" />
                {((pendingCount > 0 && user?.role === 'super_admin') || unreadCount > 0) && (
                  <span className="absolute top-1 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg py-2 border border-slate-100 z-50 max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                      <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{unreadCount} new</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div 
                            key={notif._id} 
                            className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3 ${!notif.isRead ? 'bg-indigo-50/30' : ''}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!notif.isRead ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>{notif.message}</p>
                              <p className="text-xs text-slate-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                            </div>
                            {!notif.isRead && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif._id); }}
                                className="text-indigo-600 hover:bg-indigo-100 p-1 rounded-full transition-colors shrink-0"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-slate-500 text-sm">
                          No notifications yet
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

            {/* Profile Dropdown */}
            <div className="relative">
              <div 
                className="flex items-center gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-slate-900 leading-none mb-1">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-slate-500 capitalize leading-none font-medium">{user?.role?.replace('_', ' ')}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 border border-indigo-200/50 overflow-hidden flex-shrink-0 shadow-sm">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold">
                      {user?.firstName?.charAt(0) || <User className="w-5 h-5" />}
                    </div>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              </div>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-fade-in origin-top-right">
                    <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                      <p className="text-sm font-bold text-slate-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                    </div>
                    <Link 
                      to={`/${user?.role?.replace('_', '-')}/profile`}
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User className="w-4 h-4 mr-3 text-slate-400" /> My Profile
                    </Link>
                    <button onClick={logout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4 mr-3 text-red-500" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
