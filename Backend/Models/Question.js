import mongoose from "mongoose";

export const QuestionSchema = new Schema({
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100 
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  questions: [{
    questionText: { 
      type: String, 
      required: true,
      trim: true 
    },
    questionType: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'short-answer'],
      default: 'multiple-choice'
    },
    options: {
      type: [String],
      validate: {
        validator: function(v) {
          // For multiple choice, require at least 2 options
          return this.questionType !== 'multiple-choice' || v.length >= 2;
        },
        message: 'Multiple choice questions require at least 2 options'
      }
    },
    correctAnswer: { 
      type: Schema.Types.Mixed, // Can be String for MC, Boolean for TF, etc.
      required: true 
    },
    points: {
      type: Number,
      default: 1,
      min: 0
    },
    explanation: {
      type: String,
      trim: true
    }
  }],
  isActive: { 
    type: Boolean, 
    default: false 
  },
  duration: { 
    type: Number, 
    min: 0, // 0 means no time limit
    default: 0 
  },
  passingScore: {
    type: Number,
    min: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  scheduledPublish: Date,
  scheduledClose: Date
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true } 
});

// Virtual for total possible points
QuestionSchema.virtual('totalPoints').get(function() {
  return this.questions.reduce((sum, question) => sum + question.points, 0);
});