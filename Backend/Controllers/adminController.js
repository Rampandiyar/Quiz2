import User from '../Models/User.js';
import Admin from '../Models/Admin.js';
import Role from '../models/Role.js';

export const createAdmin = async (req, res) => {
  try {
    const { userId, staffId, permissions, departmentResponsibility } = req.body;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is already an admin
    const existingAdmin = await Admin.findOne({ user: userId });
    if (existingAdmin) {
      return res.status(400).json({ message: 'User is already an admin' });
    }
    
    // Assign admin role if not already assigned
    const adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      return res.status(500).json({ message: 'Admin role not found' });
    }
    
    if (!user.roles.some(role => role.equals(adminRole._id))) {
      user.roles.push(adminRole._id);
      await user.save();
    }
    
    // Create admin
    const admin = new Admin({
      user: userId,
      staffId,
      permissions,
      departmentResponsibility
    });
    
    await admin.save();
    
    res.status(201).json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().populate('user', 'firstName lastName email');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).populate('user', 'firstName lastName email');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('user', 'firstName lastName email');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Remove admin role from user
    const adminRole = await Role.findOne({ name: 'Admin' });
    if (adminRole) {
      await User.findByIdAndUpdate(admin.user, {
        $pull: { roles: adminRole._id }
      });
    }
    
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};