import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  questionType: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'short-answer'],
    default: 'multiple-choice'
  },
  options: [{
    type: String,
    required: function() {
      return this.questionType === 'multiple-choice';
    }
  }],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Correct answer is required']
  },
  points: {
    type: Number,
    default: 1,
    min: [0, 'Points cannot be negative']
  },
  explanation: {
    type: String,
    trim: true
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true
  },
  questions: [questionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  duration: {
    type: Number, // in minutes
    min: [0, 'Duration cannot be negative'],
    default: 0 // 0 means no time limit
  },
  passingScore: {
    type: Number,
    min: [0, 'Passing score cannot be negative']
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total points
quizSchema.virtual('totalPoints').get(function() {
  return this.questions.reduce((sum, question) => sum + question.points, 0);
});

// Query helper to get only published quizzes
quizSchema.query.published = function() {
  return this.where({ isPublished: true });
};

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;