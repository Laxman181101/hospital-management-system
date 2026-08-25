const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  }
});

const reviewSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auth',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const hospitalSchema = new mongoose.Schema(
  {
    hospitalName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      street: {
        type: String,
        required: true,
      },
      area: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        default: 'India',
      },
      pincode: {
        type: String,
        required: true,
      },
    },
    location: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },

    phone: {
      type: String,
      required: true,
    },
    emergencyNumber: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    services: [serviceSchema],

    logoUrl: {
      type: String,
      trim: true,
    },

    images: [
      {
        type: String,
        trim: true,
      }
    ],

    reviews: [reviewSchema],

    averageRating: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    licenseNumber: {
      type: String,
      trim: true,
    },

    documentUrl: {
      type: String,
    },

    facilities: {
      type: [String],
      default: [],
    },

    settings: {
      slotDurationMinutes: {
        type: Number,
        default: 15,
        min: 5,
        max: 120
      },
      supportedConsultations: {
        type: [String],
        enum: ['physical', 'video', 'audio', 'chat'],
        default: ['physical', 'video', 'audio', 'chat']
      },
      operatingHours: {
        type: [{
          day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            required: true
          },
          isOpen: { type: Boolean, default: true },
          openTime: { type: String, default: '09:00 AM' },
          closeTime: { type: String, default: '05:00 PM' }
        }],
        default: []
      }
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auth',
    },
  },
  { timestamps: true }
);

const Hospital = mongoose.model('Hospital', hospitalSchema);
module.exports = Hospital;