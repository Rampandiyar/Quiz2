import QuizAttempt from '../Models/QuizAttempt.js';
import Quiz from '../Models/Quiz.js';
import User from '../Models/User.js';
import  AppError  from '../Utils/errorHandler.js';

export const getQuizResults = async (req, res, next) => {
  try {
    const results = await QuizAttempt.find({ quiz: req.params.quizId })
      .populate('user', 'firstName lastName email')
      .sort({ score: -1 });
    
    res.json(results);
  } catch (error) {
    next(error);
  }
};

export const getUserResults = async (req, res, next) => {
  try {
    const results = await QuizAttempt.find({ user: req.user.id })
      .populate('quiz', 'title')
      .sort({ submittedAt: -1 });
    
    res.json(results);
  } catch (error) {
    next(error);
  }
};

export const getResultDetails = async (req, res, next) => {
  try {
    const result = await QuizAttempt.findById(req.params.id)
      .populate('quiz', 'title questions')
      .populate('user', 'firstName lastName');
    
    if (!result) return next(new AppError('Result not found', 404));
    
    if (result.user._id.toString() !== req.user.id && !req.user.roles.includes('admin')) {
      return next(new AppError('Unauthorized', 401));
    }
    
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const exportResults = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return next(new AppError('Quiz not found', 404));
    
    const results = await QuizAttempt.find({ quiz: quiz._id })
      .populate('user', 'firstName lastName email registrationNumber');
    
    // Convert to CSV
    let csv = 'Name,Email,Registration Number,Score,Percentage\n';
    results.forEach(result => {
      const percentage = (result.score / quiz.totalPoints * 100).toFixed(2);
      csv += `${result.user.firstName} ${result.user.lastName},${result.user.email},${result.user.registrationNumber},${result.score},${percentage}%\n`;
    });
    
    res.header('Content-Type', 'text/csv');
    res.attachment(`results-${quiz.title}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};