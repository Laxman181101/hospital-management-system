import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Building2, User, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const RegisterHospital = () => {
  const [formData, setFormData] = useState({
    hospitalName: '',
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/api/v1/auth/register', {
        ...formData,
        role: 'hospital_admin'
      });
      addToast('Hospital registered successfully! Awaiting approval.', 'success');
      navigate('/pending-approval');
    } catch (error) {
      addToast(error.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
          <Activity className="text-white w-6 h-6" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Register Your Hospital</h2>
        <p className="mt-2 text-sm text-slate-600">
          Join the platform as a Hospital Administrator
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Hospital Name"
              name="hospitalName"
              icon={<Building2 className="w-5 h-5" />}
              required
              value={formData.hospitalName}
              onChange={handleChange}
              placeholder="e.g. City General Hospital"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="firstName"
                icon={<User className="w-5 h-5" />}
                required
                value={formData.firstName}
                onChange={handleChange}
              />
              <Input
                label="Last Name"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
            <Input
              label="Email Address"
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
              {isLoading ? 'Registering...' : 'Submit Application'}
              {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an approved account?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterHospital;
