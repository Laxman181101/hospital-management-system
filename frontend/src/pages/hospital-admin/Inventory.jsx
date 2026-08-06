import React from 'react';
import EmptyState from '../../components/ui/EmptyState';
import { Package } from 'lucide-react';

const Inventory = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight capitalize">
            Hospital Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-2">Monitor hospital supplies, stock transactions, and inventory items.</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px] flex items-center justify-center">
        <EmptyState 
          icon={Package} 
          title="Inventory tracking coming soon" 
          description="The inventory management module is currently being integrated." 
          className="border-none bg-transparent"
        />
      </div>
    </div>
  );
};

export default Inventory;
