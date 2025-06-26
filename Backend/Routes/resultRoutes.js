import express from 'express';
import {
  getQuizResults,
  getUserResults,
  getResultDetails,
  exportResults
} from '../Controllers/resultController.js';
import { authenticate, authorize } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Student routes
router.get('/my-results', getUserResults);
router.get('/:id', getResultDetails);

// Instructor/admin routes
router.get('/quiz/:quizId', authorize(['admin', 'instructor']), getQuizResults);
router.get('/export/:quizId', authorize(['admin', 'instructor']), exportResults);

export default router;