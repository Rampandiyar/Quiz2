import mongoose from 'mongoose';

const { Schema } = mongoose; // ✅ Destructure Schema from mongoose

const CategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: String,
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category' // Self-referencing relationship
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Category', CategorySchema); // ✅ Export model
