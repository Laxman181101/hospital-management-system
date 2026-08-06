import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const StaffLogin = () => {
  const [formData, setFormData] = useState({ loginId: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post('/api/v1/auth/login', formData);
      const { user, tokens } = response.data;
      login(user, tokens.accessToken, tokens.refreshToken);
      addToast('Staff login successful!');
      if (user.role === 'doctor') {
        navigate('/doctor');
      } else if (user.role === 'pharmacist') {
        navigate('/pharmacist');
      } else {
        navigate('/staff');
      }
    } catch (error) {
      addToast(error.response?.data?.message || 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[50%] rounded-full bg-teal-400/10 filter blur-[100px]"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="mx-auto w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center mb-4">
          <Activity className="text-white w-6 h-6" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Staff Portal</h2>
        <p className="mt-2 text-sm text-slate-600">
          Login for Doctors, Nurses, and Hospital Staff
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start">
            <ShieldCheck className="text-blue-600 mt-0.5 mr-3 flex-shrink-0" size={18} />
            <p className="text-sm text-blue-800">
              Staff accounts cannot be registered publicly. Please contact your Hospital Administrator if you do not have an account.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Email or Mobile"
              name="loginId"
              icon={<Mail className="w-5 h-5" />}
              required
              value={formData.loginId}
              onChange={handleChange}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              icon={<Lock className="w-5 h-5" />}
              required
              value={formData.password}
              onChange={handleChange}
            />

            <Button type="submit" disabled={isLoading} className="w-full justify-center bg-teal-600 hover:bg-teal-700 shadow-teal-600/30">
              {isLoading ? 'Authenticating...' : 'Secure Staff Login'}
              {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
