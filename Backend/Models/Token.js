import mongoose from 'mongoose';

const TokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId, // use fully-qualified path
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['access', 'refresh', 'reset', 'verification'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  blacklisted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

TokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Token', TokenSchema);
