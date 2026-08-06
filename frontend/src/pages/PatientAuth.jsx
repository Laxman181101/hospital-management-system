import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, Mail, ArrowRight, User, Phone } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const PatientAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    loginId: '', // Used for login
    email: '',   // Used for register
    mobile: '',  // Used for register
    password: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isLogin) {
        // Login Flow
        const response = await api.post('/api/v1/auth/login', {
          loginId: formData.loginId,
          password: formData.password
        });
        const { user, tokens } = response.data;
        login(user, tokens.accessToken, tokens.refreshToken);
        addToast('Welcome back!');
        navigate('/patient');
      } else {
        // Register Flow
        await api.post('/api/v1/auth/register', {
          ...formData,
          role: 'patient'
        });
        addToast('Account created successfully! Please log in.', 'success');
        setIsLogin(true);
      }
    } catch (error) {
      addToast(error.response?.data?.message || (isLogin ? 'Login failed' : 'Registration failed'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[50%] rounded-full bg-indigo-400/10 filter blur-[100px]"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/20">
          <Activity className="text-white w-6 h-6" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {isLogin ? 'Patient Login' : 'Create Patient Account'}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {isLogin ? 'Sign in to book appointments and manage records' : 'Join to find hospitals and book appointments anywhere'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="firstName"
                  icon={<User className="w-5 h-5" />}
                  required={!isLogin}
                  value={formData.firstName}
                  onChange={handleChange}
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  required={!isLogin}
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            )}

            {isLogin ? (
              <Input
                label="Email or Mobile"
                name="loginId"
                icon={<Mail className="w-5 h-5" />}
                required
                value={formData.loginId}
                onChange={handleChange}
              />
            ) : (
              <>
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  icon={<Mail className="w-5 h-5" />}
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
                <Input
                  label="Mobile Number"
                  name="mobile"
                  type="tel"
                  icon={<Phone className="w-5 h-5" />}
                  required
                  value={formData.mobile}
                  onChange={handleChange}
                />
              </>
            )}

            <Input
              label="Password"
              name="password"
              type="password"
              icon={<Lock className="w-5 h-5" />}
              required
              value={formData.password}
              onChange={handleChange}
            />

            <Button type="submit" disabled={isLoading} className="w-full justify-center">
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
            </Button>
          </form>

          <div className="mt-6 text-center pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                {isLogin ? 'Sign up here' : 'Log in instead'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientAuth;
