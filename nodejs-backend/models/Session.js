const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    default: '1', 
    required: true 
  },
  resumeText: String,
  fileName: String,
  status: { 
    type: String, 
    default: 'ACTIVE',
    enum: ['ACTIVE', 'COMPLETED', 'ABANDONED']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  totalQuestions: Number,
  answeredQuestions: { 
    type: Number, 
    default: 0 
  },
  isAnalyzed: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Session', sessionSchema);