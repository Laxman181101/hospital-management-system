import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
  const [activeTab, setActiveTab] = useState('email'); // 'email' or 'otp'
  
  // Email state
  const [emailData, setEmailData] = useState({ loginId: '', password: '' });
  
  // OTP state
  const [otpData, setOtpData] = useState({ mobile: '', otp: ['', '', '', '', '', ''] });
  const [otpSent, setOtpSent] = useState(false);
  const otpRefs = useRef([]);

  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!emailData.loginId || !emailData.password) {
      addToast('Please enter both Email/Mobile and Password', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await api.post('/api/v1/auth/login', emailData);
      const { user, tokens } = response.data;
      login(user, tokens.accessToken, tokens.refreshToken);
      addToast('Login successful!');
      
      // Smart Redirect Logic
      const isPending = user.status === 'pending' || user.isApproved === false;
      
      switch (user.role) {
        case 'super_admin':
          navigate('/super-admin');
          break;
        case 'hospital_admin':
          navigate(isPending ? '/pending-approval' : '/hospital-admin');
          break;
        case 'patient':
          navigate('/patient');
          break;
        default:
          // staff (doctor, receptionist, pharmacist, lab_technician)
          navigate('/staff');
          break;
      }
    } catch (error) {
      addToast(error.response?.data?.message || 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(otpData.mobile)) {
      addToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/api/v1/auth/request-otp', { mobile: otpData.mobile });
      setOtpSent(true);
      addToast('OTP sent successfully!');
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to send OTP', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpData.otp];
    newOtp[index] = value;
    setOtpData(prev => ({ ...prev, otp: newOtp }));

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpData.otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    const otpCode = otpData.otp.join('');
    if (otpCode.length !== 6) {
      addToast('Please enter a valid 6-digit OTP', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/v1/auth/login-with-otp', { mobile: otpData.mobile, otp: otpCode });
      const { user, accessToken, refreshToken } = response.data.data;
      login(user, accessToken, refreshToken);
      addToast('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      addToast(error.response?.data?.message || 'Invalid OTP', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
          <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <Activity className="text-white w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Smart Sign In</h2>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to access your role-specific dashboard
          </p>
        </div>

        <Card className="p-8">
          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => { setActiveTab('email'); setOtpSent(false); }}
            >
              Email & Password
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'otp' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('otp')}
            >
              Mobile OTP
            </button>
          </div>

          {activeTab === 'email' ? (
            <form onSubmit={handleEmailLogin} className="space-y-5">
              <Input
                label="Email or Mobile"
                value={emailData.loginId}
                onChange={(e) => setEmailData({ ...emailData, loginId: e.target.value })}
                placeholder="Enter your email or mobile"
              />
              <div className="space-y-1">
                <Input
                  label="Password"
                  type="password"
                  value={emailData.password}
                  onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                  placeholder="••••••••"
                />
                <div className="flex justify-end pt-1">
                  <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-primary-hover">
                    Forgot Password?
                  </Link>
                </div>
              </div>
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Sign In
              </Button>
            </form>
          ) : (
            <div>
              {!otpSent ? (
                <form onSubmit={handleRequestOtp} className="space-y-5">
                  <Input
                    label="Mobile Number"
                    type="tel"
                    value={otpData.mobile}
                    onChange={(e) => setOtpData({ ...otpData, mobile: e.target.value })}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                  />
                  <Button type="submit" className="w-full" isLoading={isLoading}>
                    Send OTP
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleOtpLogin} className="space-y-5">
                  <div className="text-center mb-4">
                    <p className="text-sm text-slate-600">Enter the 6-digit code sent to</p>
                    <p className="font-medium text-slate-900">{otpData.mobile}</p>
                  </div>
                  
                  <div className="flex justify-between gap-2 mb-6">
                    {otpData.otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => otpRefs.current[idx] = el}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-12 h-14 text-center text-xl font-bold bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                      />
                    ))}
                  </div>

                  <Button type="submit" className="w-full" isLoading={isLoading}>
                    Verify & Login
                  </Button>
                  
                  <div className="text-center mt-4">
                    <button 
                      type="button" 
                      className="text-sm font-medium text-slate-500 hover:text-primary transition-colors"
                      onClick={() => setOtpSent(false)}
                    >
                      Change Mobile Number
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </Card>

        <p className="mt-8 text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary hover:text-primary-hover">
            Register your hospital
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
