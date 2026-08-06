import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

const PendingApproval = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-amber-200">
          <Clock className="text-amber-600 w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Registration Pending</h2>
        <p className="text-lg text-slate-600 mb-8 px-4">
          Your hospital account has been created and is currently awaiting approval from a Super Administrator.
        </p>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <p className="text-sm text-slate-500">
            We will review your application shortly. You will be able to log in and access your dashboard once your account is verified and approved.
          </p>
        </div>

        <Link to="/">
          <Button variant="secondary" className="inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Homepage
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default PendingApproval;
