import React from 'react';
import { Settings as SettingsIcon, User, Lock, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your Super Admin profile and security preferences</p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <User className="w-5 h-5 mr-2 text-indigo-600" />
            Profile Information
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-8 mb-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden relative group cursor-pointer">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <User className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-semibold">Change</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="First Name" defaultValue={user?.firstName} disabled />
                <Input label="Last Name" defaultValue={user?.lastName} disabled />
              </div>
              <Input label="Email Address" defaultValue={user?.email} disabled />
              <p className="text-xs text-slate-500">Contact system administrator to change core identity details.</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <Lock className="w-5 h-5 mr-2 text-indigo-600" />
            Change Password
          </h2>
          
          <form className="space-y-4 max-w-md">
            <Input label="Current Password" type="password" />
            <Input label="New Password" type="password" />
            <Input label="Confirm New Password" type="password" />
            
            <Button className="mt-6">
              <Save className="w-4 h-4 mr-2" />
              Update Password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
