import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  deleteUserAccount,
  uploadUserPhoto,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../Controllers/userController.js';
import { authenticate, authorize } from '../Middleware/authMiddleware.js';
import { upload } from '../Utils/fileUpload.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Protected routes (require authentication)
router.use(authenticate);

router.get('/me', getCurrentUser);
router.patch('/update-profile', updateUserProfile);
router.patch('/update-password', updatePassword);
router.delete('/delete-account', deleteUserAccount);
router.post('/upload-photo', upload.single('photo'), uploadUserPhoto);
router.post('/logout', logoutUser);

// Admin-only routes
router.use(authorize(['admin']));

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;