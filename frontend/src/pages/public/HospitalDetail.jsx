import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Mail, CalendarPlus, ChevronRight, User, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StarRating from '../../components/ui/StarRating';
import DoctorProfileModal from '../../components/shared/DoctorProfileModal';

const HospitalDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [hospital, setHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('overview');
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);

  // Calculate available doctors today
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = daysOfWeek[new Date().getDay()];
  const availableDoctorsCount = doctors.filter(doc => 
    doc.availabilitySchedule?.some(schedule => schedule.day === today)
  ).length;

  useEffect(() => {
    const fetchHospitalData = async () => {
      setLoading(true);
      try {
        const [hospRes, docRes, revRes] = await Promise.all([
          api.get(`/api/v1/hospitals/${id}`),
          api.get(`/api/v1/hospitals/${id}/doctors`).catch(() => ({ data: { data: [] } })),
          api.get(`/api/v1/hospitals/${id}/reviews`).catch(() => ({ data: { data: [] } }))
        ]);
        
        setHospital(hospRes.data.data);
        setDoctors(docRes.data.doctors || docRes.data.data || []);
        setReviews(revRes.data.data || []);
      } catch (error) {
        console.error('Failed to load hospital details:', error);
        addToast('error', 'Failed to load hospital details.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchHospitalData();
    }
  }, [id, addToast]);

  const submitReview = async () => {
    if (newReview.rating === 0) {
      addToast('error', 'Please provide a star rating.');
      return;
    }
    setSubmittingReview(true);
    try {
      await api.post(`/api/v1/hospitals/${id}/reviews`, newReview);
      addToast('success', 'Review submitted successfully!');
      setShowReviewModal(false);
      
      // Refresh reviews
      const revRes = await api.get(`/api/v1/hospitals/${id}/reviews`);
      setReviews(revRes.data.data || []);
    } catch (error) {
      addToast('error', error.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <AlertCircle size={48} className="text-danger mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Hospital Not Found</h2>
        <p className="text-slate-500 mb-6">The hospital you're looking for doesn't exist or has been removed.</p>
        <Link to="/hospitals">
          <Button variant="primary">Back to Directory</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Banner */}
      <div className="h-[300px] md:h-[400px] w-full bg-slate-800 relative">
        {hospital.images && hospital.images.length > 0 ? (
          <img src={hospital.images[0]} alt="Hospital Hero" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-4 sm:p-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-end relative">
            {hospital.logoUrl && (
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-2xl p-2 shadow-2xl border-4 border-slate-900/20 translate-y-4 md:translate-y-8 flex-shrink-0 z-10">
                <img src={hospital.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-xl" />
              </div>
            )}
            
            <div className="flex-1 pb-2 md:pb-0 z-10">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-white">{hospital.hospitalName}</h1>
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white/90">
                  <StarRating rating={hospital.averageRating || 0} size={14} />
                  <span className="text-sm font-medium">{hospital.averageRating ? hospital.averageRating.toFixed(1) : 'New'}</span>
                </div>
              </div>
              <p className="text-slate-300 flex items-center gap-2 text-sm sm:text-base">
                <MapPin size={16} />
                {hospital.address?.street}, {hospital.address?.city}, {hospital.address?.state}
              </p>
            </div>
            
            <div className="z-10 pb-2 md:pb-0 w-full md:w-auto">
              <Button variant="primary" className="w-full md:w-auto shadow-lg shadow-primary/20 gap-2">
                <CalendarPlus size={18} />
                Book Appointment
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              <button 
                onClick={() => setActiveTab('overview')} 
                className={`py-3 px-6 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('doctors')} 
                className={`py-3 px-6 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'doctors' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Doctors ({doctors.length})
              </button>
              <button 
                onClick={() => setActiveTab('reviews')} 
                className={`py-3 px-6 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'reviews' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Reviews ({reviews.length})
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">About Hospital</h3>
                  <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">
                    {hospital.description || 'No description provided.'}
                  </p>
                </Card>

                {hospital.services && hospital.services.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Services & Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {hospital.services.map((service, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-primary/5 text-primary text-sm font-semibold rounded-lg border border-primary/10">
                          {service.name || service}
                        </span>
                      ))}
                    </div>
                  </Card>
                )}

                {hospital.images && hospital.images.length > 1 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Infrastructure</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {hospital.images.slice(1).map((img, idx) => (
                        <div key={idx} className="aspect-video rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                          <img src={img} alt={`Facility ${idx+1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
                
                {/* Available Facilities */}
                {hospital.facilities && hospital.facilities.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Facilities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {hospital.facilities.map((facility, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="text-sm font-medium">{facility}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'doctors' && (
              <div className="animate-fade-in space-y-4">
                {doctors.length === 0 ? (
                  <Card className="p-8 text-center text-slate-500">
                    <User size={48} className="mx-auto mb-4 text-slate-300" />
                    <p>No doctors listed for this hospital yet.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {doctors.map(doc => (
                      <Card 
                        key={doc._id} 
                        className="p-4 flex gap-4 items-center hover:border-primary/30 transition-colors cursor-pointer group"
                        onClick={() => {
                          setSelectedDoctor(doc);
                          setIsDoctorModalOpen(true);
                        }}
                      >
                        <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                          {doc.profilePicture ? (
                            <img src={doc.profilePicture} alt={doc.name || doc.user?.firstName || doc.firstName || ''} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold text-xl">
                              {(doc.name || doc.user?.firstName || doc.firstName || 'D').charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 group-hover:text-primary transition-colors">Dr. {doc.name || `${doc.user?.firstName || doc.firstName || ''} ${doc.user?.lastName || doc.lastName || ''}`}</h4>
                          <p className="text-sm text-slate-500">{doc.specialization || 'General Physician'}</p>
                          <p className="text-xs font-medium text-slate-400 mt-1">{doc.experience} years exp.</p>
                        </div>
                        <ChevronRight className="ml-auto text-slate-300 group-hover:text-primary transition-colors" size={20} />
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="animate-fade-in space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Patient Reviews</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={hospital.averageRating || 0} size={20} />
                      <span className="font-bold text-slate-700">{hospital.averageRating ? hospital.averageRating.toFixed(1) : 'No ratings yet'}</span>
                    </div>
                  </div>
                  {user?.role === 'patient' && (
                    <Button variant="outline" onClick={() => setShowReviewModal(true)}>Write a Review</Button>
                  )}
                  {!user && (
                    <p className="text-sm text-slate-500"><Link to="/login" className="text-primary hover:underline">Log in</Link> to review</p>
                  )}
                </div>

                {reviews.length === 0 ? (
                  <Card className="p-8 text-center text-slate-500">
                    <Star size={48} className="mx-auto mb-4 text-slate-300" />
                    <p>No reviews yet. Be the first to share your experience!</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <Card key={review._id} className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                              {review.patientId?.firstName?.charAt(0) || 'P'}
                            </div>
                            <div>
                              <h5 className="font-bold text-sm text-slate-800">{review.patientId?.firstName} {review.patientId?.lastName}</h5>
                              <p className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <StarRating rating={review.rating} size={14} />
                        </div>
                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">{review.comment}</p>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Stats Card */}
            <Card className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg shadow-indigo-200">
              <h3 className="text-lg font-bold mb-4 opacity-90">Hospital Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-3 rounded-xl border border-white/20 backdrop-blur-sm">
                  <p className="text-sm font-medium opacity-80 mb-1">Total Doctors</p>
                  <p className="text-2xl font-bold">{doctors.length}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl border border-white/20 backdrop-blur-sm">
                  <p className="text-sm font-medium opacity-80 mb-1">Available Today</p>
                  <p className="text-2xl font-bold">{availableDoctorsCount}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Contact Info</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <MapPin className="text-primary mt-0.5" size={18} />
                  <div>
                    <p className="font-medium text-slate-800">{hospital.address?.street}</p>
                    <p>{hospital.address?.area}</p>
                    <p>{hospital.address?.city}, {hospital.address?.state} {hospital.address?.pincode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone className="text-primary" size={18} />
                  <a href={`tel:${hospital.phone}`} className="font-medium text-slate-800 hover:text-primary">{hospital.phone}</a>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail className="text-primary" size={18} />
                  <a href={`mailto:${hospital.email}`} className="font-medium text-slate-800 hover:text-primary">{hospital.email}</a>
                </div>
              </div>
            </Card>

            {/* Minimap Placeholder (or actual map if location exists) */}
            <Card className="p-1 overflow-hidden h-48 bg-slate-100 flex items-center justify-center relative">
              {hospital.location?.latitude ? (
                <div className="absolute inset-0 bg-slate-200 flex flex-col items-center justify-center text-slate-400">
                  <MapPin size={32} className="text-primary/50 mb-2" />
                  <span className="text-xs font-medium uppercase tracking-widest">Map View Available</span>
                  {/* Actual map integration would go here */}
                </div>
              ) : (
                <div className="text-slate-400 text-sm font-medium">Map location not set</div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Write a Review</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
              <StarRating 
                rating={newReview.rating} 
                max={5} 
                size={32} 
                readOnly={false} 
                onChange={(val) => setNewReview(prev => ({...prev, rating: val}))} 
                className="justify-center py-2"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Share your experience</label>
              <textarea
                rows="4"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-sm"
                placeholder="How was the doctor, staff, and facilities?"
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({...prev, comment: e.target.value}))}
              ></textarea>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowReviewModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={submitReview} loading={submittingReview}>Submit Review</Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Doctor Profile Modal */}
      <DoctorProfileModal 
        isOpen={isDoctorModalOpen} 
        onClose={() => setIsDoctorModalOpen(false)} 
        doctor={selectedDoctor} 
      />
    </div>
  );
};

export default HospitalDetail;
