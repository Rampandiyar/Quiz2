import Quiz from '../models/Quiz.js';
import QuizSettings from '../Models/QuizSettings.js';
import Category from '../Models/Category.js';
import QuizAttempt from '../models/QuizAttempt.js';

export const createQuiz = async (req, res) => {
  try {
    const { title, description, questions, category, duration, passingScore } = req.body;
    
    const quiz = new Quiz({
      title,
      description,
      questions,
      createdBy: req.user.id,
      category,
      duration,
      passingScore
    });
    
    await quiz.save();
    
    // Create default settings
    const settings = new QuizSettings({
      quiz: quiz._id,
      shuffleQuestions: false,
      shuffleAnswers: false,
      showCorrectAnswers: false,
      showResults: true,
      allowedAttempts: 1
    });
    
    await settings.save();
    
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate('createdBy', 'firstName lastName')
      .populate('category', 'name');
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('category', 'name');
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Clean up related data
    await QuizSettings.deleteOne({ quiz: quiz._id });
    await QuizAttempt.deleteMany({ quiz: quiz._id });
    
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const startQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Check if user has already attempted this quiz
    const existingAttempt = await QuizAttempt.findOne({
      user: req.user.id,
      quiz: quiz._id,
      status: { $ne: 'submitted' }
    });
    
    if (existingAttempt) {
      return res.json(existingAttempt);
    }
    
    const attempt = new QuizAttempt({
      user: req.user.id,
      quiz: quiz._id,
      startedAt: new Date(),
      status: 'in-progress'
    });
    
    await attempt.save();
    
    res.status(201).json(attempt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body;
    
    const attempt = await QuizAttempt.findById(req.params.attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    
    if (attempt.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (attempt.status === 'submitted') {
      return res.status(400).json({ message: 'Quiz already submitted' });
    }
    
    const quiz = await Quiz.findById(attempt.quiz);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Calculate score
    let totalScore = 0;
    const processedAnswers = answers.map(answer => {
      const question = quiz.questions.id(answer.question);
      if (!question) return null;
      
      const isCorrect = question.correctAnswer === answer.selectedAnswer;
      const pointsAwarded = isCorrect ? question.points : 0;
      totalScore += pointsAwarded;
      
      return {
        question: answer.question,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        pointsAwarded,
        timeTaken: answer.timeTaken || 0
      };
    }).filter(Boolean);
    
    attempt.answers = processedAnswers;
    attempt.totalScore = totalScore;
    attempt.percentage = (totalScore / quiz.totalPoints) * 100;
    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    
    await attempt.save();
    
    res.json(attempt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getQuizResults = async (req, res) => {
  try {
    const results = await QuizAttempt.find({ quiz: req.params.id, status: 'submitted' })
      .populate('user', 'firstName lastName email')
      .sort({ submittedAt: -1 });
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserResults = async (req, res) => {
  try {
    const results = await QuizAttempt.find({ user: req.user.id, status: 'submitted' })
      .populate('quiz', 'title')
      .sort({ submittedAt: -1 });
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};