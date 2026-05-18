const mongoose = require('mongoose');

const memberLevelSchema = new mongoose.Schema({
  level: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  minGrowthValue: { type: Number, required: true },
  privileges: [{ type: String }],
  icon: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MemberLevel', memberLevelSchema);