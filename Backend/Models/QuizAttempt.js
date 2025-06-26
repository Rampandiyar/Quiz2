import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz.questions',
    required: true
  },
  selectedAnswer: mongoose.Schema.Types.Mixed,
  isCorrect: Boolean,
  pointsAwarded: {
    type: Number,
    default: 0
  },
  timeTaken: Number // in seconds
});

const quizAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  answers: [answerSchema],
  startedAt: {
    type: Date,
    default: Date.now
  },
  submittedAt: Date,
  score: {
    type: Number,
    default: 0
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate percentage before saving
quizAttemptSchema.pre('save', function(next) {
  if (this.isModified('score') && this.quiz) {
    this.percentage = (this.score / this.quiz.totalPoints) * 100;
  }
  next();
});

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
export default QuizAttempt;