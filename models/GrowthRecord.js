const mongoose = require('mongoose');

const growthRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changeType: { type: String, required: true, enum: ['earn', 'expire'] },
  amount: { type: Number, required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GrowthRecord', growthRecordSchema);