import React from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import { Users, Activity, Calendar } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      </div>
      
      {/* Welcome Widget */}
      <Card className="p-6 md:p-8 bg-gradient-to-br from-primary to-teal-500 text-white border-0">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.firstName}!</h2>
        <p className="text-primary-light">
          You are logged in as a {user?.role?.replace('_', ' ')}. Here is your overview for today.
        </p>
      </Card>

      {/* Role specific widgets */}
      {user?.role === 'super_admin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">Total Hospitals</h3>
            <p className="text-3xl font-bold text-slate-900 mt-1">0</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">Active Staff</h3>
            <p className="text-3xl font-bold text-slate-900 mt-1">0</p>
          </Card>
        </div>
      )}

      {user?.role === 'hospital_admin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">Hospital Staff</h3>
            <p className="text-3xl font-bold text-slate-900 mt-1">0</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">Appointments Today</h3>
            <p className="text-3xl font-bold text-slate-900 mt-1">0</p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
