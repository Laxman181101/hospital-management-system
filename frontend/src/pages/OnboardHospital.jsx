import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Hospital, User, FileText, CheckCircle2, ChevronRight, ChevronLeft, UploadCloud, File as FileIcon, X } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const STEPS = [
  { id: 1, title: 'Hospital Details', icon: Hospital },
  { id: 2, title: 'Admin Account', icon: User },
  { id: 3, title: 'Document Upload', icon: FileText }
];

const OnboardHospital = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    hospitalName: '',
    hospitalAddress: '',
    hospitalCity: '',
    hospitalContactNumber: '',
    hospitalEmail: '',
    licenseNumber: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminMobile: '',
    adminPassword: '',
    confirmPassword: ''
  });

  const [documentFile, setDocumentFile] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        addToast('error', 'Only JPEG, PNG, or PDF files are allowed.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        addToast('error', 'File size must be less than 10MB.');
        return;
      }
      setDocumentFile(file);
      setErrors(prev => ({ ...prev, document: '' }));
    }
  };

  const removeFile = () => {
    setDocumentFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.hospitalName) newErrors.hospitalName = 'Hospital Name is required';
      if (!formData.hospitalAddress) newErrors.hospitalAddress = 'Address is required';
      if (!formData.hospitalCity) newErrors.hospitalCity = 'City is required';
      if (!formData.hospitalContactNumber) newErrors.hospitalContactNumber = 'Contact Number is required';
      if (!formData.licenseNumber) newErrors.licenseNumber = 'License Number is required';
    } else if (step === 2) {
      if (!formData.adminFirstName) newErrors.adminFirstName = 'First Name is required';
      if (!formData.adminEmail) newErrors.adminEmail = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) newErrors.adminEmail = 'Invalid email address';
      if (!formData.adminMobile) newErrors.adminMobile = 'Mobile is required';
      if (!formData.adminPassword) newErrors.adminPassword = 'Password is required';
      else if (formData.adminPassword.length < 6) newErrors.adminPassword = 'Password must be at least 6 characters';
      if (formData.adminPassword !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    } else if (step === 3) {
      if (!documentFile) newErrors.document = 'Registration Certificate is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const payload = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'confirmPassword') {
          payload.append(key, formData[key]);
        }
      });
      payload.append('document', documentFile);

      await api.post('/api/v1/hospitals/onboard', payload);

      setSuccess(true);
    } catch (error) {
      addToast('error', error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center animate-fade-in">
          <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Registration Successful! 🎉</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Your application is under review. Our Super Admin will verify your documents and approve your account within 24-48 hours. You'll receive a confirmation email once approved.
          </p>
          <Button variant="primary" className="w-full" onClick={() => navigate('/login')}>
            Return to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-12 pb-24 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-3xl w-full mx-auto mb-10 text-center">
        <Link to="/" className="inline-flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Hospital size={24} />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ApolloCare
          </span>
        </Link>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Register Your Hospital</h1>
        <p className="text-slate-500">Join our digital healthcare platform and manage your hospital effortlessly.</p>
      </div>

      {/* Stepper */}
      <div className="max-w-3xl w-full mx-auto mb-12">
        <div className="relative flex justify-between">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          ></div>
          
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 
                  isCompleted ? 'bg-primary text-white' : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}>
                  {isCompleted ? <CheckCircle2 size={24} /> : <Icon size={24} />}
                </div>
                <span className={`mt-3 text-sm font-medium ${isActive ? 'text-primary' : 'text-slate-500'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-3xl w-full mx-auto">
        <Card className="p-6 md:p-8 shadow-xl shadow-slate-200/50">
          
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">Hospital Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Hospital Name *" name="hospitalName" value={formData.hospitalName} onChange={handleChange} error={errors.hospitalName} placeholder="e.g. City General Hospital" className="md:col-span-2" />
                <Input label="License / Registration Number *" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} error={errors.licenseNumber} placeholder="e.g. LIC-12345" />
                <Input label="Contact Number *" name="hospitalContactNumber" value={formData.hospitalContactNumber} onChange={handleChange} error={errors.hospitalContactNumber} placeholder="+1 234 567 890" />
                <Input label="Hospital Email (Optional)" name="hospitalEmail" type="email" value={formData.hospitalEmail} onChange={handleChange} placeholder="hospital@example.com" />
                <Input label="City *" name="hospitalCity" value={formData.hospitalCity} onChange={handleChange} error={errors.hospitalCity} placeholder="e.g. New York" />
                <Input label="Full Address *" name="hospitalAddress" value={formData.hospitalAddress} onChange={handleChange} error={errors.hospitalAddress} placeholder="123 Healthcare Ave, Suite 100" className="md:col-span-2" />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">Admin Account</h2>
              <p className="text-sm text-slate-500 mb-4">This account will have full administrative access to manage the hospital profile, staff, and settings.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="First Name *" name="adminFirstName" value={formData.adminFirstName} onChange={handleChange} error={errors.adminFirstName} placeholder="John" />
                <Input label="Last Name" name="adminLastName" value={formData.adminLastName} onChange={handleChange} placeholder="Doe" />
                <Input label="Admin Email *" name="adminEmail" type="email" value={formData.adminEmail} onChange={handleChange} error={errors.adminEmail} placeholder="admin@hospital.com" />
                <Input label="Admin Mobile *" name="adminMobile" value={formData.adminMobile} onChange={handleChange} error={errors.adminMobile} placeholder="+1 987 654 321" />
                
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Input label="Password *" name="adminPassword" type="password" value={formData.adminPassword} onChange={handleChange} error={errors.adminPassword} placeholder="••••••••" />
                    {formData.adminPassword && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${
                            formData.adminPassword.length < 6 ? 'w-1/3 bg-danger' : 
                            formData.adminPassword.length < 10 ? 'w-2/3 bg-warning' : 'w-full bg-success'
                          }`}></div>
                        </div>
                        <span className="text-xs font-medium text-slate-500">
                          {formData.adminPassword.length < 6 ? 'Weak' : formData.adminPassword.length < 10 ? 'Fair' : 'Strong'}
                        </span>
                      </div>
                    )}
                  </div>
                  <Input label="Confirm Password *" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} placeholder="••••••••" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">Document Upload</h2>
              <p className="text-sm text-slate-500 mb-6">Please upload your hospital's official registration or license certificate for verification.</p>
              
              <div 
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors duration-300 ${
                  errors.document ? 'border-danger bg-danger/5' : 
                  documentFile ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-primary hover:bg-slate-50'
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange({ target: { files: e.dataTransfer.files }});
                  }
                }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".jpg,.jpeg,.png,.pdf" 
                  className="hidden" 
                />
                
                {documentFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-primary mb-4 relative">
                      <FileIcon size={32} />
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); removeFile(); }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-danger hover:border-danger transition-colors shadow-sm"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p className="text-sm font-medium text-slate-800 truncate max-w-xs">{documentFile.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{(documentFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-16 h-16 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 mb-4 group-hover:text-primary transition-colors">
                      <UploadCloud size={32} />
                    </div>
                    <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-500 mt-2">JPEG, PNG or PDF (max. 10MB)</p>
                  </div>
                )}
              </div>
              {errors.document && <p className="text-sm text-danger mt-2 text-center">{errors.document}</p>}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100">
            <Button 
              variant="outline" 
              onClick={handleBack} 
              disabled={currentStep === 1 || loading}
              className={currentStep === 1 ? 'opacity-0 pointer-events-none' : ''}
              icon={ChevronLeft}
            >
              Back
            </Button>
            
            {currentStep < STEPS.length ? (
              <Button variant="primary" onClick={handleNext} className="gap-2">
                Continue <ChevronRight size={18} />
              </Button>
            ) : (
              <Button variant="primary" onClick={handleSubmit} disabled={loading || !documentFile} loading={loading}>
                Submit Application
              </Button>
            )}
          </div>

        </Card>
        
        <p className="text-center text-slate-500 text-sm mt-8">
          Already registered? <Link to="/login" className="text-primary font-medium hover:underline">Sign in here</Link>
        </p>
      </div>
    </div>
  );
};

export default OnboardHospital;
