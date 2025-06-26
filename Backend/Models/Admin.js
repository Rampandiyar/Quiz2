import mongoose from 'mongoose';

const { Schema } = mongoose; // ✅ Define Schema properly

const AdminSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  staffId: {
    type: String,
    required: true,
    unique: true
  },
  permissions: [{
    type: String,
    enum: ['create_quiz', 'edit_quiz', 'delete_quiz', 'view_results', 'manage_users']
  }],
  departmentResponsibility: {
    type: String,
    enum: ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'All'],
    default: 'All'
  }
}, {
  timestamps: true
});

export default mongoose.model('Admin', AdminSchema); // ✅ Export the model
