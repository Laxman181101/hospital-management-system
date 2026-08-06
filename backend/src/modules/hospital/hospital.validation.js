const Joi = require('joi');

const createHospitalValidation = Joi.object({
  hospitalName: Joi.string().required(),

  description: Joi.string().required(),

  address: Joi.object({
    street: Joi.string().required(),
    area: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().optional(),
    pincode: Joi.string().required(),
  }).required(),

  location: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
  }).required(),

  phone: Joi.string().required(),
  emergencyNumber: Joi.string().optional(),
  email: Joi.string().email().required(),

  services: Joi.array().items(
    Joi.object({
      title: Joi.string().required(),
      description: Joi.string().required(),
    })
  ),
});

const addServiceValidation = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
});

const addReviewValidation = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().required(),
});

module.exports = {
  createHospitalValidation,
  addServiceValidation,
  addReviewValidation,
};