import cloudinary from 'cloudinary';
import fs from 'fs';
import  AppError from './errorHandler.js';
import multer from 'multer';  
// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'tmp/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Create Multer upload middleware
export const upload = multer({ storage: storage });
/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder
 * @returns {Promise<Object>} Upload result
 */
export const fileUpload = async (filePath, folder) => {
  try {
    if (!filePath) throw new AppError('No file provided', 400);
    
    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder: `quiz-app/${folder}`,
      resource_type: 'auto'
    });
    
    // Delete file from local storage
    fs.unlinkSync(filePath);
    
    return result;
  } catch (error) {
    // Clean up if error occurs
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
export const fileDelete = async (publicId) => {
  try {
    if (!publicId) throw new AppError('No public ID provided', 400);
    
    const result = await cloudinary.v2.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} Public ID
 */
export const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  
  const matches = url.match(/upload\/(?:v\d+\/)?([^\.]+)/);
  return matches ? matches[1] : null;
};