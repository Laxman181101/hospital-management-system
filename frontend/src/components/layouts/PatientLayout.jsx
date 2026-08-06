import React from 'react';
import DashboardLayout from './DashboardLayout';
import { LayoutDashboard, Search, Calendar, FileText, Receipt, Settings } from 'lucide-react';

const PatientLayout = () => {
  const menuItems = [
    { path: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/patient/search', label: 'Find Doctors', icon: Search },
    { path: '/patient/appointments', label: 'My Appointments', icon: Calendar },
    { path: '/patient/records', label: 'Medical Records', icon: FileText },
    { path: '/patient/billing', label: 'Billing & Invoices', icon: Receipt },
    { path: '/patient/settings', label: 'Settings', icon: Settings },
  ];

  return <DashboardLayout title="Patient Portal" menuItems={menuItems} />;
};

export default PatientLayout;
