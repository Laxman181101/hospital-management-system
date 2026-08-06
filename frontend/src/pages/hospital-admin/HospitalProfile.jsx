import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import StarRating from '../../components/ui/StarRating';
import { 
  Building2, MapPin, Image as ImageIcon, Plus, X, 
  AlertTriangle, Loader2, Save, Upload, Edit2, 
  ChevronLeft, ChevronRight, Star, Trash2, Settings
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons issue in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
};

const HospitalProfile = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [formData, setFormData] = useState({});
  const [mapPosition, setMapPosition] = useState(null);
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState('');
  const [reviews, setReviews] = useState([]);
  
  // Carousel State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchHospitalData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/hospitals/${user.hospitalId}`);
      const h = res.data.data;
      setHospital(h);
      setFormData({
        hospitalName: h.hospitalName || '',
        description: h.description || '',
        phone: h.phone || '',
        email: h.email || '',
        street: h.address?.street || '',
        city: h.address?.city || '',
        state: h.address?.state || '',
        pincode: h.address?.pincode || ''
      });
      if (h.location?.latitude && h.location?.longitude) {
        setMapPosition([h.location.latitude, h.location.longitude]);
      } else {
        setMapPosition([20.5937, 78.9629]);
      }
      setServices(h.services || []);

      // Fetch reviews
      try {
        const revRes = await api.get(`/api/v1/hospitals/${user.hospitalId}/reviews`);
        setReviews(revRes.data.data || []);
      } catch (e) {
        console.error("Could not fetch reviews", e);
      }
    } catch (error) {
      addToast('error', 'Failed to load hospital profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.hospitalId) fetchHospitalData();
  }, [user]);

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updateData = {
        hospitalName: formData.hospitalName,
        description: formData.description,
        phone: formData.phone,
        email: formData.email,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          area: formData.street
        }
      };
      await api.put(`/api/v1/hospitals/${hospital._id}`, updateData);
      addToast('success', 'Profile updated successfully');
      setIsEditingInfo(false);
      fetchHospitalData();
    } catch (error) {
      addToast('error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const payload = new FormData();
      payload.append('logo', file);
      await api.post(`/api/v1/hospitals/${hospital._id}/upload-logo`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      addToast('success', 'Logo uploaded successfully');
      fetchHospitalData();
    } catch (error) {
      addToast('error', 'Failed to upload logo');
    }
  };

  const handleBannerUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const payload = new FormData();
      for (let i = 0; i < files.length; i++) {
        payload.append('images', files[i]);
      }
      await api.post(`/api/v1/hospitals/${hospital._id}/upload-images`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      addToast('success', 'Images uploaded successfully');
      fetchHospitalData();
    } catch (error) {
      addToast('error', 'Failed to upload images');
    }
  };

  const handleDeleteImage = async (imageUrl) => {
    if (window.confirm('Are you sure you want to delete this cover image?')) {
      try {
        await api.delete(`/api/v1/hospitals/${hospital._id}/remove-image`, {
          data: { imageUrl }
        });
        addToast('success', 'Image deleted successfully');
        if (currentImageIndex > 0) {
          setCurrentImageIndex(currentImageIndex - 1);
        }
        fetchHospitalData();
      } catch (error) {
        addToast('error', 'Failed to delete image');
      }
    }
  };

  const handleSaveLocation = async () => {
    if (!mapPosition) return;
    try {
      await api.patch(`/api/v1/hospitals/location/${hospital._id}`, {
        latitude: mapPosition[0],
        longitude: mapPosition[1]
      });
      addToast('success', 'Location updated successfully');
    } catch (error) {
      addToast('error', 'Failed to update location');
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newService.trim()) return;
    try {
      await api.post(`/api/v1/hospitals/${hospital._id}/services`, {
        title: newService,
        description: ''
      });
      setNewService('');
      addToast('success', 'Service added');
      fetchHospitalData();
    } catch (error) {
      addToast('error', 'Failed to add service');
    }
  };

  const handleRemoveService = async (serviceId) => {
    try {
      await api.delete(`/api/v1/hospitals/${hospital._id}/services/${serviceId}`);
      addToast('success', 'Service removed');
      fetchHospitalData();
    } catch (error) {
      addToast('error', 'Failed to remove service');
    }
  };

  const handleToggleStatus = async () => {
    if (window.confirm(`Are you sure you want to ${hospital.isActive ? 'deactivate' : 'activate'} your hospital?`)) {
      try {
        await api.patch(`/api/v1/hospitals/${hospital._id}/status`, { isActive: !hospital.isActive });
        addToast('success', 'Status updated successfully');
        fetchHospitalData();
      } catch (error) {
        addToast('error', 'Failed to update status');
      }
    }
  };

  const handleDeleteHospital = async () => {
    const confirmName = window.prompt(`DANGER ZONE: Type "${hospital.hospitalName}" to confirm deletion. This cannot be undone.`);
    if (confirmName === hospital.hospitalName) {
      try {
        await api.delete(`/api/v1/hospitals/${hospital._id}`);
        addToast('success', 'Hospital deleted successfully');
        window.location.href = '/login';
      } catch (error) {
        addToast('error', 'Failed to delete hospital');
      }
    } else if (confirmName !== null) {
      addToast('error', 'Hospital name did not match. Deletion cancelled.');
    }
  };

  if (loading) return <div className="flex h-[calc(100vh-64px)] items-center justify-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;
  if (!hospital) return <div className="p-8 text-center text-slate-500">Hospital profile not found.</div>;

  return (
    <div className="flex-1 overflow-y-auto">
      
      {/* Banner Section */}
      <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 xl:h-[400px] w-full bg-slate-900 group transition-all duration-300">
        {hospital.images && hospital.images.length > 0 ? (
          <>
            <img 
              src={hospital.images[currentImageIndex]} 
              alt="Hospital Cover" 
              className="w-full h-full object-cover opacity-80"
            />
            {hospital.images.length > 1 && (
              <>
                <button 
                  onClick={() => setCurrentImageIndex(prev => (prev === 0 ? hospital.images.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={() => setCurrentImageIndex(prev => (prev === hospital.images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={24} />
                </button>
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {hospital.images.map((_, idx) => (
                    <div key={idx} className={`w-2 h-2 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-white/40'}`} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-800">
            <ImageIcon size={48} className="mb-2 opacity-50" />
            <p className="text-sm font-medium">No cover images uploaded</p>
          </div>
        )}

        <div className="absolute top-4 right-4 group/settings">
          <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-md">
            <Settings size={16} className="mr-2" /> Cover Settings
          </Button>
          
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 opacity-0 pointer-events-none group-hover/settings:opacity-100 group-hover/settings:pointer-events-auto transition-all transform origin-top-right z-50 border border-slate-100">
            <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Manage Images
            </div>
            <button 
              onClick={() => bannerInputRef.current?.click()}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
            >
              <Upload size={16} className="text-slate-500" /> Upload New Cover
            </button>
            {hospital.images && hospital.images.length > 0 && (
              <button 
                onClick={() => handleDeleteImage(hospital.images[currentImageIndex])}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
              >
                <Trash2 size={16} /> Delete Current Image
              </button>
            )}
          </div>
          <input type="file" ref={bannerInputRef} onChange={handleBannerUpload} accept="image/*" multiple className="hidden" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        
        {/* Profile Header (Overlapping Banner) */}
        <div className="relative -mt-16 sm:-mt-24 mb-8 flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
          <div className="relative group">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-2xl p-2 shadow-xl border-4 border-white flex items-center justify-center overflow-hidden z-10 shrink-0">
              {hospital.logoUrl ? (
                <img src={hospital.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 size={48} className="text-slate-300" />
              )}
            </div>
            <button 
              onClick={() => logoInputRef.current?.click()}
              className="absolute bottom-2 right-2 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-20 tooltip-trigger"
              title="Change Logo"
            >
              <Edit2 size={16} />
            </button>
            <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
          </div>

          <div className="flex-1 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{hospital.hospitalName}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600">
                  <span className="flex items-center gap-1"><MapPin size={16} /> {hospital.address?.city || 'Location not set'}, {hospital.address?.state || ''}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">License: {hospital.licenseNumber}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm ${hospital.isActive ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${hospital.isActive ? 'bg-success animate-pulse' : 'bg-slate-400'}`}></span>
                  {hospital.isActive ? 'Active' : 'Inactive'}
                </span>
                <Button variant="outline" onClick={handleToggleStatus}>
                  {hospital.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* About / Info Card */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Hospital Information</h2>
                {!isEditingInfo && (
                  <Button variant="outline" className="text-sm" onClick={() => setIsEditingInfo(true)}>
                    <Edit2 size={16} className="mr-2" /> Edit Info
                  </Button>
                )}
              </div>

              {isEditingInfo ? (
                <form onSubmit={handleSaveDetails} className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Hospital Name" value={formData.hospitalName} onChange={e => setFormData({...formData, hospitalName: e.target.value})} required className="md:col-span-2" />
                    <Input label="Email Address" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    <Input label="Contact Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">About Hospital</label>
                      <textarea 
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-sm"
                        rows="4"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                      ></textarea>
                    </div>

                    <h3 className="md:col-span-2 text-sm font-bold text-slate-900 mt-4 border-b border-slate-100 pb-2">Address Details</h3>
                    <Input label="Street / Area" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className="md:col-span-2" />
                    <Input label="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                    <Input label="State" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                    <Input label="Pincode" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} />
                  </div>
                  
                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={() => setIsEditingInfo(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" loading={saving} icon={Save}>Save Changes</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 mb-2">About</h3>
                    <p className="text-slate-700 text-sm leading-relaxed">{hospital.description || 'No description provided.'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contact</h3>
                      <p className="text-sm text-slate-700 font-medium mb-1">{hospital.phone || 'N/A'}</p>
                      <p className="text-sm text-slate-700 font-medium">{hospital.email || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Address</h3>
                      <p className="text-sm text-slate-700 font-medium">{hospital.address?.street}</p>
                      <p className="text-sm text-slate-700 font-medium">{hospital.address?.city}, {hospital.address?.state} {hospital.address?.pincode}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Services Card */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Services Offered</h2>
              <div className="flex flex-wrap gap-2 mb-6">
                {services.map(service => (
                  <div key={service._id || service.title} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-semibold group transition-colors hover:bg-indigo-100">
                    {service.title}
                    <button type="button" onClick={() => handleRemoveService(service._id)} className="text-indigo-400 hover:text-indigo-700 p-0.5 rounded-full hover:bg-indigo-200 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {services.length === 0 && <p className="text-slate-500 text-sm">No services added yet.</p>}
              </div>
              <form onSubmit={handleAddService} className="flex gap-3 max-w-sm">
                <input 
                  type="text"
                  placeholder="e.g. Cardiology, 24/7 Emergency..." 
                  value={newService} 
                  onChange={e => setNewService(e.target.value)} 
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                />
                <Button type="submit" variant="primary" disabled={!newService.trim()} className="px-4">
                  Add
                </Button>
              </form>
            </Card>

            {/* Reviews Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">Patient Reviews</h2>
                <div className="flex items-center gap-2">
                  <StarRating rating={hospital.averageRating || 0} size={18} />
                  <span className="font-bold text-slate-900 text-lg">{hospital.averageRating ? hospital.averageRating.toFixed(1) : '0'}</span>
                  <span className="text-slate-500 text-sm">({hospital.totalReviews || 0})</span>
                </div>
              </div>
              
              <div className="space-y-4">
                {reviews.length > 0 ? reviews.map(review => (
                  <div key={review._id} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{review.patient?.firstName} {review.patient?.lastName}</p>
                        <p className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                      <StarRating rating={review.rating} size={14} />
                    </div>
                    <p className="text-sm text-slate-700">{review.comment}</p>
                  </div>
                )) : (
                  <div className="text-center py-8 text-slate-500 text-sm">No reviews yet.</div>
                )}
              </div>
            </Card>

          </div>

          {/* Sidebar (Right) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Map Card */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-2">Location</h2>
              <p className="text-xs text-slate-500 mb-4">Click the map to update the hospital's pin location.</p>
              
              <div className="h-48 w-full rounded-xl overflow-hidden mb-4 border border-slate-200 z-0 relative">
                {mapPosition && (
                  <MapContainer center={mapPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker position={mapPosition} setPosition={setMapPosition} />
                  </MapContainer>
                )}
              </div>
              
              <Button variant="outline" className="w-full text-sm" onClick={handleSaveLocation}>
                Update Pin Location
              </Button>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 border-danger/20 bg-danger/5">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-danger shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-danger mb-1">Danger Zone</h3>
                  <p className="text-slate-600 text-xs mb-4">
                    Deleting your hospital is permanent. All staff, records, and data will be lost.
                  </p>
                  <Button variant="outline" className="w-full text-xs border-danger text-danger hover:bg-danger hover:text-white" onClick={handleDeleteHospital}>
                    Delete Hospital
                  </Button>
                </div>
              </div>
            </Card>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalProfile;
