import express from 'express';
import {
  createQuiz,
  getQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  startQuiz,
  submitQuiz,

  publishQuiz,
  closeQuiz
} from '../Controllers/quizController.js';
import { authenticate, authorize } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Public routes (read-only)
router.get('/', getQuizzes);
router.get('/:id', getQuiz);

// Protected routes
router.use(authenticate);

router.post('/', authorize(['admin', 'instructor']), createQuiz);
router.put('/:id', authorize(['admin', 'instructor']), updateQuiz);
router.delete('/:id', authorize(['admin', 'instructor']), deleteQuiz);

// Quiz taking flow
router.post('/:id/start', startQuiz);
router.post('/:attemptId/submit', submitQuiz);

// Quiz management


router.post('/:id/publish', authorize(['admin', 'instructor']), publishQuiz);
router.post('/:id/close', authorize(['admin', 'instructor']), closeQuiz);

export default router;