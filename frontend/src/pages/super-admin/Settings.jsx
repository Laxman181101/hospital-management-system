import React from 'react';
import { Settings as SettingsIcon, User, Lock, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ProfilePictureUpload from '../../components/ui/ProfilePictureUpload';

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
            <ProfilePictureUpload currentImage={user?.profilePicture} size="w-24 h-24" />
            
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
