import React from 'react';
import { Send, Megaphone, Clock } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const Announcements = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Announcements</h1>
        <p className="text-sm text-slate-500 mt-1">Broadcast messages to hospital administrators across the platform</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-bl-lg">
              🚧 Coming Soon
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Megaphone className="w-5 h-5 mr-2 text-indigo-600" />
              Compose Message
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
                <select disabled className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-slate-50 text-slate-500 opacity-70">
                  <option>All Hospital Admins</option>
                  <option>Active Hospitals Only</option>
                  <option>All Platform Staff</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <input disabled type="text" placeholder="e.g. Scheduled Maintenance Notice" className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-slate-50 text-slate-500 opacity-70" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea disabled rows={5} placeholder="Write your announcement here..." className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-slate-50 text-slate-500 opacity-70"></textarea>
              </div>
              <div className="flex justify-end group">
                <Button disabled className="opacity-50 cursor-not-allowed">
                  <Send className="w-4 h-4 mr-2" />
                  Send Broadcast
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Past Broadcasts</h2>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="p-4 sm:px-6 hover:bg-slate-50 transition-colors opacity-70">
                <h3 className="text-sm font-bold text-slate-900">System Upgrade V2.0</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">We will be rolling out a massive update next weekend. Expect 2 hours of downtime.</p>
                <div className="flex items-center mt-3 text-xs text-slate-400 font-medium">
                  <Clock className="w-3 h-3 mr-1" /> Sent 2 weeks ago
                </div>
              </div>
              <div className="p-4 sm:px-6 hover:bg-slate-50 transition-colors opacity-70">
                <h3 className="text-sm font-bold text-slate-900">Welcome to HealthSaaS!</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">Thank you for joining our platform. Here is a quick guide on how to register your staff.</p>
                <div className="flex items-center mt-3 text-xs text-slate-400 font-medium">
                  <Clock className="w-3 h-3 mr-1" /> Sent 1 month ago
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Announcements;
