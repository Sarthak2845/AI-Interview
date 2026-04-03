const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    unique: true
  },
  tags: [{
    type: String,
    required: true,
    lowercase: true,
    index: true
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for efficient queries
questionBankSchema.index({ tags: 1, difficulty: 1 });
questionBankSchema.index({ category: 1, difficulty: 1 });
questionBankSchema.index({ usageCount: -1, averageScore: -1 });

module.exports = mongoose.model('QuestionBank', questionBankSchema);