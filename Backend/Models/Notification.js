import mongoose from 'mongoose';

const { Schema } = mongoose; // ✅ Fix: define Schema

const NotificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['quiz_assigned', 'quiz_result', 'system', 'announcement'],
    required: true
  },
  relatedEntity: {
    type: Schema.Types.ObjectId,
    refPath: 'relatedEntityModel' // ✅ Dynamic reference
  },
  relatedEntityModel: {
    type: String,
    enum: ['Quiz', 'QuizAttempt', 'User'] // ✅ Supports dynamic population
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.model('Notification', NotificationSchema); // ✅ Export model
