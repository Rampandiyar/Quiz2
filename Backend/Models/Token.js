export const TokenSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
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

// Add TTL index for automatic expiration
TokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });