export const QuizSettingsSchema = new Schema({
  quiz: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  shuffleAnswers: {
    type: Boolean,
    default: false
  },
  timeLimit: {
    type: Number,
    min: 0
  },
  showCorrectAnswers: {
    type: Boolean,
    default: false
  },
  showResults: {
    type: Boolean,
    default: true
  },
  allowedAttempts: {
    type: Number,
    min: 1,
    default: 1
  },
  accessCode: String,
  ipRestrictions: [String]
}, {
  timestamps: true
});