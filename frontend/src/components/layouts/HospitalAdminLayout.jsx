import React from 'react';
import DashboardLayout from './DashboardLayout';
import { LayoutDashboard, Users, HeartPulse, Building2, Pill, Activity, Receipt, Settings } from 'lucide-react';

const HospitalAdminLayout = () => {
  const menuItems = [
    { path: '/hospital-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/hospital-admin/staff', label: 'Staff Management', icon: Users },
    { path: '/hospital-admin/operation-theater', label: 'Operation Theaters', icon: HeartPulse },
    { path: '/hospital-admin/ward', label: 'Ward & Beds', icon: Building2 },
    { path: '/hospital-admin/pharmacy', label: 'Pharmacy', icon: Pill },
    { path: '/hospital-admin/ambulance', label: 'Ambulances', icon: Activity },
    { path: '/hospital-admin/finance', label: 'Finance', icon: Receipt },
    { path: '/hospital-admin/settings', label: 'Settings', icon: Settings },
  ];

  return <DashboardLayout title="Hospital Admin" menuItems={menuItems} />;
};

export default HospitalAdminLayout;
