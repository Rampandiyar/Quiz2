import express from 'express';
import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory
} from '../Controllers/categoryController.js';
import { authenticate, authorize } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Public read access
router.get('/', getCategories);
router.get('/:id', getCategory);

// Protected routes
router.use(authenticate);
router.use(authorize(['admin', 'instructor']));

router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;