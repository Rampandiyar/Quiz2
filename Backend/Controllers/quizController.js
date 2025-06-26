import Quiz from '../Models/Quiz.js';
import QuizSettings from '../Models/QuizSettings.js';
import QuizAttempt from '../Models/QuizAttempt.js';
import AppError from '../Utils/errorHandler.js';

export const createQuiz = async (req, res, next) => {
  try {
    const { title, questions, duration, passingScore } = req.body;
    
    const quiz = new Quiz({
      title,
      questions,
      duration,
      passingScore,
      createdBy: req.user.id
    });
    
    await quiz.save();
    
    // Create default settings
    const settings = new QuizSettings({
      quiz: quiz._id,
      shuffleQuestions: false,
      shuffleAnswers: false
    });
    
    await settings.save();
    
    res.status(201).json(quiz);
  } catch (error) {
    next(error);
  }
};

export const getQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ isPublished: true })
      .populate('createdBy', 'firstName lastName');
    res.json(quizzes);
  } catch (error) {
    next(error);
  }
};

export const getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'firstName lastName');
    
    if (!quiz) {
      return next(new AppError('Quiz not found', 404));
    }
    
    res.json(quiz);
  } catch (error) {
    next(error);
  }
};

export const updateQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!quiz) {
      return next(new AppError('Quiz not found', 404));
    }
    
    res.json(quiz);
  } catch (error) {
    next(error);
  }
};

export const deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    
    if (!quiz) {
      return next(new AppError('Quiz not found', 404));
    }
    
    // Clean up related data
    await QuizSettings.deleteOne({ quiz: quiz._id });
    await QuizAttempt.deleteMany({ quiz: quiz._id });
    
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

export const startQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return next(new AppError('Quiz not found', 404));
    
    const existingAttempt = await QuizAttempt.findOne({
      user: req.user.id,
      quiz: quiz._id,
      status: { $ne: 'submitted' }
    });
    
    if (existingAttempt) return res.json(existingAttempt);
    
    const attempt = new QuizAttempt({
      user: req.user.id,
      quiz: quiz._id,
      startedAt: new Date()
    });
    
    await attempt.save();
    res.status(201).json(attempt);
  } catch (error) {
    next(error);
  }
};

export const submitQuiz = async (req, res, next) => {
  try {
    const { answers } = req.body;
    
    const attempt = await QuizAttempt.findById(req.params.attemptId);
    if (!attempt) return next(new AppError('Attempt not found', 404));
    
    if (attempt.user.toString() !== req.user.id) {
      return next(new AppError('Unauthorized', 401));
    }
    
    const quiz = await Quiz.findById(attempt.quiz);
    if (!quiz) return next(new AppError('Quiz not found', 404));
    
    let score = 0;
    const processedAnswers = answers.map(answer => {
      const question = quiz.questions.id(answer.questionId);
      const isCorrect = question.correctAnswer === answer.selectedAnswer;
      if (isCorrect) score += question.points;
      
      return {
        question: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        points: isCorrect ? question.points : 0
      };
    });
    
    attempt.answers = processedAnswers;
    attempt.score = score;
    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    await attempt.save();
    
    res.json(attempt);
  } catch (error) {
    next(error);
  }
};

export const publishQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { isPublished: true, publishedAt: new Date() },
      { new: true }
    );
    
    if (!quiz) return next(new AppError('Quiz not found', 404));
    res.json(quiz);
  } catch (error) {
    next(error);
  }
};

export const closeQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { isPublished: false, closedAt: new Date() },
      { new: true }
    );
    
    if (!quiz) return next(new AppError('Quiz not found', 404));
    res.json(quiz);
  } catch (error) {
    next(error);
  }
};