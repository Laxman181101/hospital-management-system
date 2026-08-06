require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('../src/config/cloudinary');
const Hospital = require('../src/modules/hospital/hospital.model');
const fs = require('fs');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const imagePath = 'C:\\Users\\laxma\\.gemini\\antigravity-ide\\brain\\7827f5a8-a820-4fe1-9d17-e642ffed6213\\hospital_logo_1784368991945.png';
    const hospitalId = '6a5b46fe5deeb70bbc92ea42';

    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'hospitals/logos'
    });

    console.log('Uploaded to cloudinary:', result.secure_url);

    const hospital = await Hospital.findByIdAndUpdate(hospitalId, {
      logoUrl: result.secure_url
    }, { new: true });

    console.log('Hospital updated:', hospital.hospitalName);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();
