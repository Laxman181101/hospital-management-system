const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'hms_uploads', // Folder name in your cloudinary account
        allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
        // You can add more format handling here
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
