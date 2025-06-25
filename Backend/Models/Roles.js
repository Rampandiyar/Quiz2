export const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Student', 'Faculty', 'Admin', 'ContentCreator', 'Proctor']
  },
  description: {
    type: String,
    trim: true
  },
  permissions: [{
    type: String,
    required: true
  }],
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});