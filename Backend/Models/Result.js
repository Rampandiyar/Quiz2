export const QuizAttemptSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quiz: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  submittedAt: Date,
  answers: [{
    question: {
      type: Schema.Types.ObjectId,
      required: true
    },
    selectedAnswer: Schema.Types.Mixed,
    isCorrect: Boolean,
    pointsAwarded: Number,
    timeTaken: Number // in seconds
  }],
  totalScore: {
    type: Number,
    min: 0
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'graded', 'flagged'],
    default: 'in-progress'
  },
  ipAddress: String,
  deviceInfo: String
}, {
  timestamps: true
});