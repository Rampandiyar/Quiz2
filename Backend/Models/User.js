import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config.js';

const UserSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },

  // Academic Information
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  rollNumber: {
    type: String,
    unique: true,
    sparse: true, // Allows null values but enforces uniqueness for non-null
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: {
      values: [
        'Computer Science',
        'Electrical Engineering',
        'Mechanical Engineering',
        'Civil Engineering',
        'Electronics',
        'Information Technology',
        'Other'
      ],
      message: 'Please select a valid department'
    }
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [1, 'Year must be at least 1'],
    max: [5, 'Year cannot exceed 5']
  },
  semester: {
    type: Number,
    min: [1, 'Semester must be at least 1'],
    max: [10, 'Semester cannot exceed 10']
  },

  // Authentication
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,

  // Contact Information
  phoneNumber: {
    type: String,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },

  // Roles and Permissions
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],

  // Account Status
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'deactivated'],
    default: 'active'
  },
  lastLogin: Date,

  // Profile
  profilePicture: {
    type: String,
    default: 'default.jpg'
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  
  // Set passwordChangedAt if not new user
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000; // Ensure token is created after password change
  }
  next();
});

// Update timestamps on certain operations
UserSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Instance method to check password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password was changed after token was issued
UserSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to generate password reset token
UserSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Instance method to generate JWT token
UserSchema.methods.generateAuthToken = function() {
  const payload = {
    id: this._id,
    roles: this.roles
  };

  return jwt.sign(payload, config.jwt.accessTokenSecret, {
    expiresIn: config.jwt.accessTokenExpiry
  });
};

// Static method to find user by credentials
UserSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email }).select('+password').populate('roles');
  if (!user) {
    throw new Error('Invalid login credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid login credentials');
  }

  return user;
};

// Query middleware to populate roles by default
UserSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'roles',
    select: 'name permissions'
  });
  next();
});

const User = mongoose.model('User', UserSchema);
export default User;