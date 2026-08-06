import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, Save, Mail, Phone, Calendar, User, Activity, FileText, Camera, CheckCircle, ArrowRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const ManualRegistration = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [recentPatients, setRecentPatients] = useState([]);
  const [successData, setSuccessData] = useState(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    gender: 'male',
    dateOfBirth: '',
    bloodGroup: '',
    password: '',
    photo: null
  });

  useEffect(() => {
    fetchRecentPatients();
  }, []);

  const fetchRecentPatients = async () => {
    try {
      // Fetch all patients and get last 5
      const res = await api.get('/api/v1/patients');
      const allPatients = Array.isArray(res.data) ? res.data : (res.data.data || []);
      // Assuming they come sorted or we can just reverse them
      const recent = allPatients.reverse().slice(0, 5);
      setRecentPatients(recent);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, photo: file }));
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const generatePassword = () => {
    const pw = 'HMS@' + Math.floor(1000 + Math.random() * 9000);
    setFormData(prev => ({ ...prev, password: pw }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          payload.append(key, formData[key]);
        }
      });
      
      if (!formData.password) {
        payload.append('password', 'HMS@1234');
      }

      const res = await api.post('/api/v1/patients/manual', payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      addToast('success', 'Patient registered successfully');
      setSuccessData(res.data.patient || res.data.data);
      fetchRecentPatients();
      
      // Reset form but don't redirect automatically. User can click "Book Appointment" CTA.
      setFormData({
        firstName: '', lastName: '', email: '', mobile: '', gender: 'male',
        dateOfBirth: '', bloodGroup: '', password: '', photo: null
      });
      setPhotoPreview(null);
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = (patient) => {
    navigate('/staff/appointments', { state: { registeredPatient: patient } });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <UserPlus className="text-teal-600" /> Walk-in Registration
          </h1>
          <p className="text-slate-500 mt-1">Register new patients directly at the front desk</p>
        </div>
      </div>

      {successData && (
        <Card className="p-6 bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
              <CheckCircle size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Patient Registered Successfully!</h2>
              <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">{successData.firstName} {successData.lastName}</span> •
                <span>ID: {successData.patientId || 'New'}</span> •
                <span>{successData.mobile}</span>
              </div>
            </div>
          </div>
          <Button 
            className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2 whitespace-nowrap"
            onClick={() => handleBookAppointment(successData)}
          >
            Book Appointment Now <ArrowRight size={16} />
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Form */}
        <Card className="p-0 overflow-hidden lg:col-span-2 border border-slate-200">
          <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Registration Form</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Photo Upload */}
            <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-slate-100 pb-6">
              <div 
                className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden cursor-pointer hover:border-teal-400 transition-colors relative group"
                onClick={() => fileInputRef.current?.click()}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="text-slate-400 group-hover:text-teal-500" size={32} />
                )}
                {photoPreview && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={24} />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-slate-800 mb-1">Profile Photo</h3>
                <p className="text-xs text-slate-500 mb-3">Optional. Click avatar to upload a clear face photo.</p>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">First Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="John" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Last Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Doe" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Mobile Number <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="+91 9876543210" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="john.doe@example.com" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Blood Group</label>
                <div className="relative">
                  <Activity className="absolute left-3 top-3 text-slate-400" size={18} />
                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                    <option value="">Select Blood Group (Optional)</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-700">Portal Password</label>
                  <button type="button" onClick={generatePassword} className="text-xs text-teal-600 font-medium hover:underline">Auto-generate</button>
                </div>
                <input type="text" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Optional. Defaults to HMS@1234" />
                <p className="text-[10px] text-slate-400">If blank, standard default is assigned.</p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2">
                <Save size={18} /> {loading ? 'Registering...' : 'Complete Registration'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Right Sidebar: Recent Patients */}
        <div className="space-y-6">
          <Card className="p-0 overflow-hidden border border-slate-200 h-full max-h-[800px] flex flex-col">
            <div className="bg-slate-50 p-4 border-b border-slate-100">
              <h2 className="text-md font-bold text-slate-800">Recently Registered</h2>
            </div>
            <div className="overflow-y-auto p-4 space-y-4 flex-1">
              {recentPatients.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No recent patients found.</p>
              ) : (
                recentPatients.map(patient => (
                  <div key={patient._id} className="p-4 border border-slate-100 rounded-xl hover:border-teal-200 hover:shadow-sm transition-all group">
                    <div className="flex gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                        {patient.firstName?.charAt(0) || patient.name?.charAt(0) || 'P'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-slate-800 truncate">{patient.name || patient.firstName + ' ' + patient.lastName}</p>
                        <p className="text-xs text-slate-500 truncate">{patient.mobile || patient.email}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full text-teal-600 border-teal-200 hover:bg-teal-50 group-hover:bg-teal-50"
                      onClick={() => handleBookAppointment(patient)}
                    >
                      Book Appointment
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default ManualRegistration;
