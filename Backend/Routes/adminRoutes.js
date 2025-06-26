import express from 'express';
import {
  createAdmin,
  getAdmins,
  getAdmin,
  updateAdmin,
  deleteAdmin,
  getUsers,
  getUser,
  updateUser,
  deleteUser
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../Middleware/authMiddleware.js';

const router = express.Router();

// All routes require admin privileges
router.use(authenticate);
router.use(authorize(['admin']));

// Admin management
router.post('/', createAdmin);
router.get('/', getAdmins);
router.get('/:id', getAdmin);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

export default router;