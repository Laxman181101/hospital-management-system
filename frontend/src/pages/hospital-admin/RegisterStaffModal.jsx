import React, { useState, useRef } from 'react';
import { X, Upload, Copy, Check, Stethoscope, Users, Loader2, ArrowRight, ArrowLeft, Dices, Camera } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { CheckCircle2 } from 'lucide-react';

const RegisterStaffModal = ({ onClose, onSuccess }) => {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
    role: 'doctor', // default
    specialization: '',
    experience: '',
    qualifications: '',
    shiftStartTime: '09:00',
    shiftEndTime: '18:00',
    consultationDuration: '20',
    consultationFee: ''
  });
  
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: pass }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('Image must be less than 5MB', 'error');
        return;
      }
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNextStep = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = 'First Name is required';
    if (!formData.email) newErrors.email = 'Email Address is required';
    if (!formData.mobile) newErrors.mobile = 'Mobile Number is required';
    if (!formData.password) newErrors.password = 'Initial Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setCurrentStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.role === 'doctor' && currentStep === 1) {
      handleNextStep();
      return;
    }

    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = 'First Name is required';
    if (!formData.email) newErrors.email = 'Email Address is required';
    if (!formData.mobile) newErrors.mobile = 'Mobile Number is required';
    if (!formData.password) newErrors.password = 'Initial Password is required';

    if (formData.role === 'doctor' && !formData.specialization) {
       newErrors.specialization = 'Doctor specialization is required';
    }
    
    if (formData.role === 'doctor' && !formData.consultationFee) {
       newErrors.consultationFee = 'Consultation fee is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // If we are on step 2 but a step 1 field is missing, go back
      if (formData.role === 'doctor' && currentStep === 2 && (newErrors.firstName || newErrors.email || newErrors.mobile || newErrors.password)) {
        setCurrentStep(1);
      }
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) payload.append(key, formData[key]);
      });
      if (profilePicture) payload.append('profilePicture', profilePicture);

      await api.post('/api/v1/auth/register-staff', payload);
      
      setCredentials({ email: formData.email, password: formData.password });
      setShowCredentials(true);
      // onSuccess will be called after they copy credentials and close
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to register staff', 'error');
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    navigator.clipboard.writeText(`Login URL: ${window.location.origin}/staff/login\nEmail: ${credentials.email}\nPassword: ${credentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleGeneratePassword = () => {
    generatePassword();
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
    addToast('Generated secure password', 'success');
  };

  if (showCredentials) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100/50">
          <div className="p-8 text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-50 to-transparent"></div>
            
            <div className="relative">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm shadow-emerald-200 border-4 border-white animate-bounce-short">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Staff Registered!</h2>
              <p className="text-slate-500 text-sm mb-8 max-w-[280px] mx-auto">Please securely share these credentials with the staff member so they can log in.</p>
              
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-left space-y-4 mb-8 relative group">
                <button 
                  onClick={handleCopyCredentials}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                  {copied && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded font-medium shadow-md">Copied!</span>}
                </button>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email / Login ID</span>
                  <span className="text-sm font-semibold text-slate-800">{credentials.email}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Temporary Password</span>
                  <span className="text-sm font-medium text-slate-800 font-mono tracking-wider bg-slate-200/50 px-2 py-1 rounded">{credentials.password}</span>
                </div>
              </div>

              <Button variant="primary" className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-md shadow-indigo-200" onClick={onSuccess}>
                Done & Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const roleOptions = [
    { id: 'doctor', label: 'Doctor', icon: Stethoscope, color: 'blue' },
    { id: 'receptionist', label: 'Receptionist', icon: Users, color: 'teal' },
    { id: 'pharmacist', label: 'Pharmacist', icon: Users, color: 'purple' },
    { id: 'lab_technician', label: 'Lab Tech', icon: Users, color: 'orange' }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Register New Staff</h2>
            {formData.role === 'doctor' && (
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-2">
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>1</div>
                  <span className={`text-xs font-medium ${currentStep >= 1 ? 'text-indigo-700' : 'text-slate-500'}`}>Basic Info</span>
                </div>
                <div className="w-4 h-px bg-slate-200"></div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2</div>
                  <span className={`text-xs font-medium ${currentStep >= 2 ? 'text-indigo-700' : 'text-slate-500'}`}>Professional</span>
                </div>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="staff-register-form" onSubmit={handleSubmit} className="space-y-8">
            
            {currentStep === 1 && (
              <div className="space-y-8 animate-fade-in">
                {/* Photo & Role */}
                <div className="flex flex-col sm:flex-row gap-8 items-start">
                  <div className="flex flex-col items-center gap-3 w-full sm:w-auto shrink-0">
                    <div 
                      className="w-32 h-32 rounded-full border-2 border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden cursor-pointer group relative shadow-inner hover:border-indigo-400 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {previewUrl ? (
                        <>
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[2px]">
                            <Camera className="text-white mb-1" size={24} />
                            <span className="text-[10px] text-white font-medium uppercase tracking-wider">Change</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="text-slate-400 mb-2 group-hover:text-indigo-500 group-hover:-translate-y-1 transition-all" size={24} />
                          <span className="text-xs text-slate-500 font-medium text-center px-4 uppercase tracking-wider">Upload Photo</span>
                        </>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  </div>

                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Select Role *</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {roleOptions.map(role => {
                        const Icon = role.icon;
                        const isSelected = formData.role === role.id;
                        return (
                          <div 
                            key={role.id}
                            onClick={() => setFormData({ ...formData, role: role.id })}
                            className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center gap-2 transition-all duration-300 hover:-translate-y-1 ${
                              isSelected 
                                ? `border-${role.color}-500 bg-${role.color}-50 shadow-md shadow-${role.color}-100 scale-[1.02]` 
                                : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? `bg-${role.color}-500 text-white` : 'bg-slate-100 text-slate-500'}`}>
                              <Icon size={16} />
                            </div>
                            <span className={`text-xs font-bold text-center ${isSelected ? `text-${role.color}-700` : 'text-slate-600'}`}>
                              {role.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Basic Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="First Name *" name="firstName" value={formData.firstName} onChange={handleChange} error={errors.firstName} placeholder="e.g. Priya" />
                    <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="e.g. Sharma" />
                    <Input label="Email Address *" type="email" name="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="priya@hospital.com" />
                    <Input label="Mobile Number *" name="mobile" value={formData.mobile} onChange={handleChange} error={errors.mobile} placeholder="+91 9876543210" />
                  </div>
                </div>
                {/* Account Credentials moved to Step 1 */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Account Credentials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Initial Password *</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Enter or generate password"
                          className="peer flex-1 h-12 px-4 bg-white/50 backdrop-blur-sm border border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-4 transition-all duration-300 placeholder:text-slate-400 text-slate-800 shadow-sm font-mono tracking-wide"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleGeneratePassword} 
                          className="shrink-0 h-12 px-4 gap-2 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border-slate-200"
                        >
                          <Dices size={18} />
                          <span className="hidden sm:inline font-semibold">Generate</span>
                        </Button>
                      </div>
                      {errors.password && <span className="text-xs text-red-500 font-medium mt-1 inline-block">{errors.password}</span>}
                      <p className="text-xs text-slate-500 mt-2 font-medium">You will securely share this with the staff member after registration.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && formData.role === 'doctor' && (
              <div className="space-y-8 animate-fade-in">
                {/* Doctor Specific Info */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Professional Details (Doctor)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Specialization *" name="specialization" value={formData.specialization} onChange={handleChange} error={errors.specialization} placeholder="e.g. Cardiology" />
                    <Input label="Consultation Fee (₹) *" type="number" name="consultationFee" value={formData.consultationFee} onChange={handleChange} error={errors.consultationFee} placeholder="e.g. 500" min="0" />
                    <Input label="Years of Experience" type="number" name="experience" value={formData.experience} onChange={handleChange} placeholder="e.g. 5" min="0" />
                    <div className="md:col-span-1">
                      <Input label="Qualifications" name="qualifications" value={formData.qualifications} onChange={handleChange} placeholder="e.g. MBBS, MD" />
                    </div>
                  </div>
                </div>

                {/* Shift and Scheduling */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Shift & Scheduling</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Shift Start Time" name="shiftStartTime" type="time" value={formData.shiftStartTime} onChange={handleChange} />
                    <Input label="Shift End Time" name="shiftEndTime" type="time" value={formData.shiftEndTime} onChange={handleChange} />
                    <Input label="Consultation Time (Mins)" name="consultationDuration" type="number" value={formData.consultationDuration} onChange={handleChange} min="5" max="60" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2 font-medium">These shift timings will be applied to all 7 days of the week by default. You can adjust specific days later in the Doctor Schedules page.</p>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between gap-3 shrink-0">
          <div>
            {currentStep === 2 && (
              <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} disabled={loading} className="font-semibold text-slate-600 hover:text-slate-800">
                <ArrowLeft size={16} className="mr-2" /> Back
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} disabled={loading} className="font-semibold text-slate-600 hover:bg-slate-200/50">Cancel</Button>
            {formData.role === 'doctor' && currentStep === 1 ? (
              <Button type="button" variant="primary" onClick={handleNextStep} className="font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-indigo-600 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                Next Step <ArrowRight size={16} className="ml-2" />
              </Button>
            ) : (
              <Button form="staff-register-form" type="submit" variant="primary" loading={loading} className="font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-indigo-600 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                Complete Registration
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterStaffModal;
