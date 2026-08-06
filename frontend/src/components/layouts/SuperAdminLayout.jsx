import React from 'react';
import DashboardLayout from './DashboardLayout';
import { LayoutDashboard, Building2, UserCheck, DollarSign, Settings } from 'lucide-react';

const SuperAdminLayout = () => {
  const menuItems = [
    { path: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/super-admin/hospitals', label: 'Hospitals', icon: Building2 },
    { path: '/super-admin/approvals', label: 'Approvals', icon: UserCheck },
    { path: '/super-admin/finance', label: 'Global Finance', icon: DollarSign },
    { path: '/super-admin/settings', label: 'Settings', icon: Settings },
  ];

  return <DashboardLayout title="Super Admin Portal" menuItems={menuItems} />;
};

export default SuperAdminLayout;
