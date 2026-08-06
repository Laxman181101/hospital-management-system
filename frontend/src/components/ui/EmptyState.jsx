import React from 'react';
import { FileQuestion } from 'lucide-react';
import Button from './Button';

const EmptyState = ({ 
  icon: Icon = FileQuestion, 
  title = 'No data available', 
  description = 'There is currently nothing to show here.', 
  actionLabel, 
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed ${className}`}>
      <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4">
        <Icon className="text-slate-300" size={32} />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      
      {actionLabel && onAction && (
        <Button variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
