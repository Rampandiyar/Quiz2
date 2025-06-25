export const CategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: String,
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});