import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Navigation2, Star, Activity, Loader2, Hospital, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import StarRating from '../../components/ui/StarRating';

const HospitalDirectory = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [findingLocation, setFindingLocation] = useState(false);

  const fetchHospitals = async (params = {}) => {
    setLoading(true);
    try {
      let endpoint = '/api/v1/hospitals/search';
      if (params.lat && params.lng) {
        endpoint = '/api/v1/hospitals/nearby';
      }

      const res = await api.get(endpoint, { params });
      setHospitals(res.data.data || res.data.hospitals || []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHospitals({ search: searchQuery, city: cityFilter });
  };

  const handleFindNearMe = () => {
    setFindingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchHospitals({ lat: position.coords.latitude, lng: position.coords.longitude });
          setFindingLocation(false);
        },
        (error) => {
          console.error(error);
          alert('Unable to retrieve your location. Please check browser permissions.');
          setFindingLocation(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setFindingLocation(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-10 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Search */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4 tracking-tight">Find the Right Hospital</h1>
          <p className="text-slate-500 mb-6 text-lg">Browse top-rated healthcare facilities, check services, and book appointments.</p>
          
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 shadow-sm">
              <ShieldCheck size={18} className="text-emerald-500" />
              <span className="text-sm font-semibold tracking-wide">Showing Only Approved & Verified Hospitals</span>
            </div>
          </div>
          
          <Card className="p-4 shadow-xl shadow-primary/5 border border-primary/10">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search by hospital name or service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                />
              </div>
              <div className="relative md:w-48">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="City"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                />
              </div>
              <Button type="submit" variant="primary" className="md:w-32">Search</Button>
            </form>
            
            <div className="mt-4 flex justify-center">
              <Button 
                variant="outline" 
                onClick={handleFindNearMe} 
                disabled={findingLocation}
                className="text-sm gap-2 w-full md:w-auto hover:bg-primary/5 hover:text-primary hover:border-primary/30"
              >
                {findingLocation ? <Loader2 className="animate-spin" size={16} /> : <Navigation2 size={16} />}
                Find Hospitals Near Me
              </Button>
            </div>
          </Card>
        </div>

        {/* Results */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">
            {hospitals.length} {hospitals.length === 1 ? 'Hospital' : 'Hospitals'} Found
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="p-5 animate-pulse flex flex-col h-full">
                <div className="w-full h-40 bg-slate-200 rounded-xl mb-4"></div>
                <div className="h-6 bg-slate-200 w-3/4 rounded mb-2"></div>
                <div className="h-4 bg-slate-200 w-1/2 rounded mb-4"></div>
                <div className="flex gap-2 mb-4">
                  <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                  <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between">
                  <div className="h-8 w-1/3 bg-slate-200 rounded"></div>
                  <div className="h-8 w-1/3 bg-slate-200 rounded"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : hospitals.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Hospital size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">No hospitals found</h3>
            <p className="text-slate-500">Try adjusting your search criteria or location.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map(hospital => (
              <Card key={hospital._id} className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300 border border-slate-200/60 overflow-hidden group">
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  {hospital.images && hospital.images.length > 0 ? (
                    <img src={hospital.images[0]} alt={hospital.hospitalName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-gradient-to-br from-slate-100 to-slate-200">
                      <Hospital size={48} />
                      <span className="text-xs font-medium mt-2 tracking-wider">NO IMAGE</span>
                    </div>
                  )}
                  {hospital.logoUrl && (
                    <div className="absolute -bottom-6 left-4 w-14 h-14 bg-white rounded-xl p-1 shadow-md border border-slate-100">
                      <img src={hospital.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                    </div>
                  )}
                </div>
                
                <div className="p-5 pt-8 flex flex-col flex-1">
                  <h3 className="font-bold text-lg text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">{hospital.hospitalName}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1 mb-3">
                    <MapPin size={14} />
                    <span className="line-clamp-1">{hospital.address?.area}, {hospital.address?.city}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <StarRating rating={hospital.averageRating || 0} size={14} />
                    <span className="text-xs font-medium text-slate-600">{hospital.averageRating ? hospital.averageRating.toFixed(1) : 'New'}</span>
                    <span className="text-xs text-slate-400">({hospital.totalReviews || 0} reviews)</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
                    {hospital.services && hospital.services.slice(0, 3).map((service, idx) => (
                      <span key={idx} className="px-2 py-1 bg-primary/5 text-primary text-[10px] font-semibold uppercase tracking-wider rounded border border-primary/10">
                        {service.name || service}
                      </span>
                    ))}
                    {hospital.services && hospital.services.length > 3 && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-medium rounded">
                        +{hospital.services.length - 3} more
                      </span>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    {hospital.distance && (
                      <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded flex items-center gap-1">
                        <Navigation2 size={12} className="text-slate-400" />
                        {hospital.distance.toFixed(1)} km away
                      </div>
                    )}
                    <Link to={`/hospitals/${hospital._id}`} className={`text-sm font-semibold text-primary hover:text-primary-focus transition-colors ${!hospital.distance ? 'ml-auto' : ''}`}>
                      View Details &rarr;
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalDirectory;
