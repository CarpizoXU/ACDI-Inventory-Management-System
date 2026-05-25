const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'inventory_manager', 'staff', 'auditor'],
      default: 'staff',
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    profile: {
      phone: String,
      department: String,
      avatarUrl: String,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
