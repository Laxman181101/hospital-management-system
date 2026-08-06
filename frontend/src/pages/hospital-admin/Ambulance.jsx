import React from 'react';
import EmptyState from '../../components/ui/EmptyState';
import { Truck } from 'lucide-react';

const Ambulance = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight capitalize">
            Ambulance Fleet
          </h1>
          <p className="text-sm text-slate-500 mt-2">Manage fleet tracking and ambulance dispatch status.</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px] flex items-center justify-center">
        <EmptyState 
          icon={Truck} 
          title="Fleet status unavailable" 
          description="Ambulance tracking features are currently in development." 
          className="border-none bg-transparent"
        />
      </div>
    </div>
  );
};

export default Ambulance;
