import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';
import { isValidEmail } from '../utils/validators';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      addToast('Please enter a valid email address', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/api/v1/auth/forgot-password', { email });
      setIsSent(true);
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to send reset link', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>
        
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Forgot Password?</h2>
            <p className="text-sm text-slate-600 mt-2">
              No worries, we'll send you reset instructions.
            </p>
          </div>

          {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Send Reset Link
              </Button>
            </form>
          ) : (
            <div className="text-center bg-slate-50 p-6 rounded-xl border border-slate-100">
              <p className="text-slate-700 font-medium mb-2">Check your inbox</p>
              <p className="text-sm text-slate-500">
                We've sent a password reset link to <span className="font-semibold">{email}</span>.
              </p>
              <Button variant="secondary" className="w-full mt-6" onClick={() => setIsSent(false)}>
                Try another email
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
