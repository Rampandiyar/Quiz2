import User from '../Models/User.js';
import Admin from '../Models/Admin.js';
import Role from '../Models/Role.js';
import { AppError } from '../Utils/errorHandler.js';

export const createAdmin = async (req, res, next) => {
  try {
    const { userId, permissions } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return next(new AppError('User not found', 404));
    
    const adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) return next(new AppError('Admin role not found', 404));
    
    if (!user.roles.includes(adminRole._id)) {
      user.roles.push(adminRole._id);
      await user.save();
    }
    
    const admin = new Admin({
      user: userId,
      permissions
    });
    
    await admin.save();
    res.status(201).json(admin);
  } catch (error) {
    next(error);
  }
};

export const getAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find().populate('user', 'firstName lastName email');
    res.json(admins);
  } catch (error) {
    next(error);
  }
};

export const getAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id).populate('user', 'firstName lastName email');
    if (!admin) return next(new AppError('Admin not found', 404));
    res.json(admin);
  } catch (error) {
    next(error);
  }
};

export const updateAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('user', 'firstName lastName email');
    
    if (!admin) return next(new AppError('Admin not found', 404));
    res.json(admin);
  } catch (error) {
    next(error);
  }
};

export const deleteAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) return next(new AppError('Admin not found', 404));
    
    const adminRole = await Role.findOne({ name: 'admin' });
    if (adminRole) {
      await User.findByIdAndUpdate(admin.user, {
        $pull: { roles: adminRole._id }
      });
    }
    
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return next(new AppError('User not found', 404));
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) return next(new AppError('User not found', 404));
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return next(new AppError('User not found', 404));
    
    // Clean up related data
    await QuizAttempt.deleteMany({ user: user._id });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};