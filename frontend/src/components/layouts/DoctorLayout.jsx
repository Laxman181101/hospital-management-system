import React from 'react';
import DashboardLayout from './DashboardLayout';
import { LayoutDashboard, Calendar, Users, Video, FileText, Settings } from 'lucide-react';

const DoctorLayout = () => {
  const menuItems = [
    { path: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/doctor/appointments', label: 'Appointments', icon: Calendar },
    { path: '/doctor/consultations', label: 'Consultations', icon: Video },
    { path: '/doctor/patients', label: 'My Patients', icon: Users },
    { path: '/doctor/prescriptions', label: 'Prescriptions', icon: FileText },
    { path: '/doctor/settings', label: 'Settings', icon: Settings },
  ];

  return <DashboardLayout title="Doctor Portal" menuItems={menuItems} />;
};

export default DoctorLayout;
