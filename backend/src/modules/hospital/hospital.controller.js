const fs = require('fs');
const path = require('path');
const cloudinary = require('../../config/cloudinary');
const {
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
} = require('./hospital.service');

const {
  createHospitalValidation,
  addServiceValidation,
  addReviewValidation,
} = require('./hospital.validation');

const authService = require('../auth/auth.service');
const Hospital = require('./hospital.model');
const notificationService = require('../notification/notification.service');
const Auth = require('../auth/auth.model');

const createHospital = async (req, res) => {
  try {
    const { error } = createHospitalValidation.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const hospital = await createHospitalService(req.body);

    return res.status(201).json({
      success: true,
      message: 'Hospital created successfully',
      data: hospital,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getHospital = async (req, res) => {
  try {
    const hospital = await getHospitalService();

    return res.status(200).json({
      success: true,
      data: hospital,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getHospitalById = async (req, res) => {
  try {
    const { id } = req.params;
    const hospital = await getHospitalByIdService(id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: hospital,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getHospitals = async (req, res) => {
  try {
    let hospitals;
    // If the user is a hospital_admin, only return their own hospital
    if (req.user && req.user.role === 'hospital_admin' && req.user.hospitalId) {
      const hospital = await Hospital.findById(req.user.hospitalId);
      hospitals = hospital ? [hospital] : [];
    } else {
      hospitals = await Hospital.find().populate('createdBy', 'isApproved');
    }
    return res.status(200).json({
      success: true,
      data: hospitals,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateHospital = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user && req.user.role === 'hospital_admin') {
      if (req.user.hospitalId && req.user.hospitalId.toString() !== id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only update your own hospital',
        });
      }
    }

    const hospital = await updateHospitalService(id, req.body);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Hospital updated successfully',
      data: hospital,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteHospital = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user && req.user.role === 'hospital_admin') {
      if (req.user.hospitalId && req.user.hospitalId.toString() !== id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only delete your own hospital',
        });
      }
    }

    const hospital = await deleteHospitalService(id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Hospital deleted successfully',
      data: hospital,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const searchHospitals = async (req, res) => {
  try {
    const hospitals = await searchHospitalsService(req.query);
    return res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getNearbyHospitals = async (req, res) => {
  try {
    const { latitude, longitude, maxDistanceKm } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required parameters',
      });
    }

    const hospitals = await getNearbyHospitalsService(
      latitude,
      longitude,
      maxDistanceKm ? parseFloat(maxDistanceKm) : undefined
    );

    return res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getHospitalDoctors = async (req, res) => {
  try {
    const { id } = req.params;
    const doctors = await getHospitalDoctorsService(id);
    return res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const uploadLogo = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a single file with field name logo',
      });
    }

    const logoUrl = req.file.path;
    const hospital = await uploadLogoService(id, logoUrl);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: hospital,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const uploadImages = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image file with field name images',
      });
    }

    const filenames = req.files.map((file) => file.path);
    const hospital = await uploadImagesService(id, filenames);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: hospital,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const removeImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl field is required in request body',
      });
    }

    const hospital = await removeImageService(id, imageUrl);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found',
      });
    }

    // Try to remove file from Cloudinary
    try {
      if (imageUrl.includes('res.cloudinary.com')) {
        const parts = imageUrl.split('/');
        const filename = parts[parts.length - 1];
        const publicId = 'hms_uploads/' + filename.split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (err) {
      console.error('Failed to delete from Cloudinary:', err);
    }

    return res.status(200).json({
      success: true,
      message: 'Image removed successfully',
      data: hospital,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const toggleHospitalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'isActive field is required in request body',
      });
    }

    const hospital = await toggleHospitalStatusService(id, isActive);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found',
      });
    }

    // Send notification to Hospital Admin if hospital is approved (isActive = true)
    if (isActive === true) {
      try {
        const hospitalAdmin = await Auth.findOne({ hospitalId: id, role: 'hospital_admin' });
        if (hospitalAdmin && hospitalAdmin.mobile) {
          const message = `Congratulations ${hospitalAdmin.firstName}! Your hospital "${hospital.hospitalName}" has been successfully approved by the Super Admin. You can now login and start managing your hospital operations.`;
          await notificationService.sendMessage(hospitalAdmin.mobile, message, 'whatsapp');
        }
      } catch (notifError) {
        console.error('Failed to send approval notification:', notifError);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Hospital status updated to ${isActive ? 'Active' : 'Inactive'}`,
      data: hospital,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const addHospitalService = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = addServiceValidation.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const hospital = await addHospitalServiceService(id, req.body);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Service added successfully',
      data: hospital,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const removeHospitalService = async (req, res) => {
  try {
    const { id, serviceId } = req.params;

    const hospital = await removeHospitalServiceService(id, serviceId);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Service removed successfully',
      data: hospital,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const addHospitalReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub || req.user.id;

    const { error } = addReviewValidation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const hospital = await addHospitalReviewService(id, userId, req.body);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: hospital,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getHospitalReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const reviews = await getHospitalReviewsService(id);
    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const setLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    if (req.user && req.user.role === 'hospital_admin') {
      if (req.user.hospitalId && req.user.hospitalId.toString() !== id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only modify your own hospital',
        });
      }
    }

    const hospital = await updateHospitalService(id, {
      location: { latitude, longitude }
    });
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Hospital location updated successfully',
      data: hospital,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const onboardHospital = async (req, res) => {
  try {
    const {
      hospitalName,
      hospitalAddress,
      hospitalCity,
      hospitalContactNumber,
      hospitalEmail,
      licenseNumber,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminMobile,
      adminPassword,
    } = req.body;

    if (
      !hospitalName ||
      !hospitalAddress ||
      !hospitalCity ||
      !hospitalContactNumber ||
      !licenseNumber ||
      !adminFirstName ||
      !adminEmail ||
      !adminMobile ||
      !adminPassword
    ) {
      return res.status(400).json({
        success: false,
        message: 'All required hospital and admin fields must be provided',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Hospital Registration Certificate (document) is required',
      });
    }

    const documentUrl = req.file.path;

    // 1. Create the Hospital Admin
    const adminUser = await authService.registerUser({
      firstName: adminFirstName,
      lastName: adminLastName,
      email: adminEmail,
      mobile: adminMobile,
      password: adminPassword,
      role: 'hospital_admin',
    });

    // 2. Create the Hospital, assigning the new Admin as the creator
    const hospital = await createHospitalService({
      hospitalName: hospitalName,
      description: hospitalName + ' Onboarded Profile',
      address: {
        street: hospitalAddress,
        area: 'Main Area',
        city: hospitalCity,
        state: 'State',
        pincode: '000000',
      },
      location: {
        latitude: 0,
        longitude: 0,
      },
      phone: hospitalContactNumber,
      email: hospitalEmail || adminEmail,
      licenseNumber: licenseNumber,
      documentUrl: documentUrl,
      createdBy: adminUser._id,
      isActive: false, // Pending Super Admin approval
    });

    // 3. Link the Hospital ID back to the Admin
    adminUser.hospitalId = hospital._id;
    await adminUser.save();

    return res.status(201).json({
      success: true,
      message: 'Hospital and Admin registered successfully. Pending Super Admin approval.',
      data: {
        hospital,
        admin: {
          _id: adminUser._id,
          email: adminUser.email,
          role: adminUser.role,
          isApproved: adminUser.isApproved,
        },
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createHospital,
  getHospital,
  getHospitalById,
  getHospitals,
  updateHospital,
  deleteHospital,
  searchHospitals,
  getNearbyHospitals,
  getHospitalDoctors,
  uploadLogo,
  uploadImages,
  removeImage,
  toggleHospitalStatus,
  addHospitalService,
  removeHospitalService,
  addHospitalReview,
  getHospitalReviews,
  setLocation,
  onboardHospital,
};
