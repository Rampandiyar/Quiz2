export const NotificationSchema = new Schema({
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
    refPath: 'relatedEntityModel'
  },
  relatedEntityModel: {
    type: String,
    enum: ['Quiz', 'QuizAttempt', 'User']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date
}, {
  timestamps: true
});