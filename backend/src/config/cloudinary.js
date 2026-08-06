const cloudinary = require('cloudinary').v2;
const env = require('./env'); // Or however environment variables are loaded in this project, wait, let's use process.env

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;
