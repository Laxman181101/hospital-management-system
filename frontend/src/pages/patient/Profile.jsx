import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Calendar, Droplets, Edit3, Save, X, Camera } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ProfilePictureUpload from '../../components/ui/ProfilePictureUpload';

const PatientProfile = () => {
  const { user, updateUserSession } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/patients/profile');
      const data = res.data?.data || res.data;
      setProfile(data);
      
      // Update global session in case they just refreshed
      updateUserSession({
        firstName: data?.firstName || data?.user?.firstName,
        lastName: data?.lastName || data?.user?.lastName,
        profilePicture: data?.photo
      });

      setForm({
        firstName: data?.firstName || data?.user?.firstName || '',
        lastName: data?.lastName || data?.user?.lastName || '',
        mobile: data?.mobile || data?.user?.mobile || '',
        dateOfBirth: data?.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
        gender: data?.gender || '',
        bloodGroup: data?.bloodGroup || '',
        address: data?.address || '',
        emergencyContact: data?.emergencyContact || '',
      });
    } catch (err) {
      console.error(err);
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let payload;
      let config = {};

      if (form.photoFile) {
        payload = new FormData();
        Object.keys(form).forEach(key => {
          if (key !== 'photoFile' && form[key] !== '') {
            payload.append(key, form[key]);
          }
        });
        payload.append('photo', form.photoFile);
        // Axios sets the correct multipart/form-data header with the boundary automatically
      } else {
        payload = { ...form };
        Object.keys(payload).forEach(key => {
          if (payload[key] === '') {
            delete payload[key];
          }
        });
      }

      const res = await api.put('/api/v1/patients/profile', payload, config);
      if (res.data?.patient) {
        updateUserSession({
          firstName: res.data.patient.firstName || res.data.patient.user?.firstName,
          lastName: res.data.patient.lastName || res.data.patient.user?.lastName,
          profilePicture: res.data.patient.photo
        });
      }
      showToast('Profile updated successfully', 'success');
      setEditing(false);
      setForm(prev => ({ ...prev, photoFile: null, photoPreview: null }));
      fetchProfile();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile?.firstName
    ? `${profile.firstName} ${profile.lastName || ''}`.trim()
    : profile?.user?.firstName
    ? `${profile.user.firstName} ${profile.user.lastName || ''}`.trim()
    : user?.firstName || 'Patient';

  const initial = displayName.charAt(0).toUpperCase();
  const age = form.dateOfBirth
    ? new Date().getFullYear() - new Date(form.dateOfBirth).getFullYear()
    : null;

  const fields = [
    { label: 'Mobile', key: 'mobile', icon: Phone, type: 'tel' },
    { label: 'Date of Birth', key: 'dateOfBirth', icon: Calendar, type: 'date' },
    { label: 'Emergency Contact', key: 'emergencyContact', icon: Phone, type: 'tel' },
    { label: 'Address', key: 'address', icon: User, type: 'text' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">View and update your personal information</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Profile Header */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <ProfilePictureUpload currentImage={profile?.photo || user?.profilePicture} size="w-24 h-24" />

              {/* Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900">{displayName}</h2>
                <p className="text-slate-500 text-sm mt-1">{profile?.user?.email || user?.email || '—'}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.bloodGroup && (
                    <Badge variant="danger">{form.bloodGroup}</Badge>
                  )}
                  {form.gender && (
                    <Badge variant="info" className="capitalize">{form.gender}</Badge>
                  )}
                  {age !== null && (
                    <Badge variant="outline">{age} years old</Badge>
                  )}
                </div>
              </div>

              {/* Edit Button */}
              {!editing ? (
                <Button variant="outline" onClick={() => setEditing(true)} className="flex items-center gap-2">
                  <Edit3 size={16} /> Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                    <Save size={16} /> {saving ? 'Saving…' : 'Save'}
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    <X size={16} />
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Details Form */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">First Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                ) : (
                  <p className="text-slate-900 font-medium py-2.5">{form.firstName || '—'}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Last Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                ) : (
                  <p className="text-slate-900 font-medium py-2.5">{form.lastName || '—'}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Gender</label>
                {editing ? (
                  <select
                    value={form.gender}
                    onChange={e => setForm({ ...form, gender: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white transition-all"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className="text-slate-900 font-medium capitalize py-2.5">{form.gender || '—'}</p>
                )}
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  <Droplets size={12} className="inline mr-1 text-red-500" /> Blood Group
                </label>
                {editing ? (
                  <select
                    value={form.bloodGroup}
                    onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white transition-all"
                  >
                    <option value="">Unknown</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-slate-900 font-medium py-2.5">{form.bloodGroup || '—'}</p>
                )}
              </div>

              {/* Other fields */}
              {fields.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    {f.label}
                  </label>
                  {editing ? (
                    <input
                      type={f.type}
                      value={form[f.key] || ''}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  ) : (
                    <p className="text-slate-900 font-medium py-2.5">{form[f.key] || '—'}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default PatientProfile;
