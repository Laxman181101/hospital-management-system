const Hospital = require('./hospital.model');
const Doctor = require('../doctor/doctor.model');

const createHospitalService = async (data) => {
  const hospital = await Hospital.create(data);
  return hospital;
};

const getHospitalService = async () => {
  const hospital = await Hospital.findOne({ isActive: true });
  return hospital;
};

const getHospitalByIdService = async (id) => {
  const hospital = await Hospital.findById(id);
  return hospital;
};

const updateHospitalService = async (id, data) => {
  const updatedHospital = await Hospital.findByIdAndUpdate(id, data, {
    returnDocument: 'after',
    runValidators: true,
  });
  return updatedHospital;
};

const deleteHospitalService = async (id) => {
  const deletedHospital = await Hospital.findByIdAndDelete(id);
  return deletedHospital;
};

const Auth = require('../auth/auth.model');

const searchHospitalsService = async (filters) => {
  const query = { 
    isActive: true
  };

  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    query.$or = [
      { hospitalName: searchRegex },
      { 'address.city': searchRegex },
      { 'address.state': searchRegex },
      { 'address.pincode': searchRegex },
      { 'services.title': searchRegex },
    ];
  }

  if (filters.city) {
    query['address.city'] = new RegExp(filters.city, 'i');
  }

  if (filters.state) {
    query['address.state'] = new RegExp(filters.state, 'i');
  }

  if (filters.service) {
    query['services.title'] = new RegExp(filters.service, 'i');
  }

  return Hospital.find(query);
};

const getNearbyHospitalsService = async (latitude, longitude, maxDistanceKm = 50) => {
  const hospitals = await Hospital.find({
    isActive: true,
    'location.latitude': { $exists: true, $ne: null },
    'location.longitude': { $exists: true, $ne: null },
  });

  if (!latitude || !longitude) {
    return hospitals;
  }

  const lat1 = parseFloat(latitude);
  const lon1 = parseFloat(longitude);

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const nearby = hospitals
    .map((h) => {
      const distance = getDistance(lat1, lon1, h.location.latitude, h.location.longitude);
      return { ...h.toObject(), distance: Math.round(distance * 100) / 100 };
    })
    .filter((h) => h.distance <= maxDistanceKm)
    .sort((a, b) => a.distance - b.distance);

  return nearby;
};

const getHospitalDoctorsService = async (hospitalId) => {
  return Doctor.find({ hospital: hospitalId }).populate('user', 'email mobile');
};

const uploadLogoService = async (id, logoUrl) => {
  return Hospital.findByIdAndUpdate(id, { logoUrl }, { returnDocument: 'after' });
};

const uploadImagesService = async (id, images) => {
  return Hospital.findByIdAndUpdate(
    id,
    { $push: { images: { $each: images } } },
    { returnDocument: 'after' }
  );
};

const removeImageService = async (id, imageUrl) => {
  return Hospital.findByIdAndUpdate(
    id,
    { $pull: { images: imageUrl } },
    { returnDocument: 'after' }
  );
};

const toggleHospitalStatusService = async (id, isActive) => {
  return Hospital.findByIdAndUpdate(id, { isActive }, { returnDocument: 'after' });
};

const addHospitalServiceService = async (id, serviceData) => {
  return Hospital.findByIdAndUpdate(
    id,
    { $push: { services: serviceData } },
    { returnDocument: 'after' }
  );
};

const removeHospitalServiceService = async (id, serviceId) => {
  return Hospital.findByIdAndUpdate(
    id,
    { $pull: { services: { _id: serviceId } } },
    { returnDocument: 'after' }
  );
};

const addHospitalReviewService = async (id, userId, reviewData) => {
  const hospital = await Hospital.findById(id);
  if (!hospital) return null;

  hospital.reviews.push({
    patient: userId,
    rating: reviewData.rating,
    comment: reviewData.comment,
  });

  const totalRating = hospital.reviews.reduce((sum, review) => sum + review.rating, 0);
  hospital.averageRating = Math.round((totalRating / hospital.reviews.length) * 10) / 10;

  await hospital.save();
  return hospital;
};

const getHospitalReviewsService = async (id) => {
  const hospital = await Hospital.findById(id).populate('reviews.patient', 'email mobile');
  return hospital ? hospital.reviews : [];
};

module.exports = {
  createHospitalService,
  getHospitalService,
  getHospitalByIdService,
  updateHospitalService,
  deleteHospitalService,
  searchHospitalsService,
  getNearbyHospitalsService,
  getHospitalDoctorsService,
  uploadLogoService,
  uploadImagesService,
  toggleHospitalStatusService,
  addHospitalServiceService,
  removeHospitalServiceService,
  addHospitalReviewService,
  getHospitalReviewsService,
  removeImageService,
};