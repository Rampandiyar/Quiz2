import express from 'express';
import {
  getNotifications,
  markAsRead,
  deleteNotification
} from '../controllers/notificationController.js';
import { authenticate } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;