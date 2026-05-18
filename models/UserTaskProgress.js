const mongoose = require('mongoose');

const userTaskProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  progress: { type: Number, default: 0 },
  target: { type: Number, default: 1 },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  resetAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserTaskProgress', userTaskProgressSchema);