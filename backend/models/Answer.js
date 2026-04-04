const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  sessionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Session', 
    required: true 
  },
  questionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Question', 
    required: true 
  },
  questionIndex: { 
    type: Number, 
    required: true 
  },
  answerText: String,
  timeSpent: Number,
  wordCount: Number,
  isAutoSave: { 
    type: Boolean, 
    default: false 
  },
  score: { 
    type: Number, 
    default: 0 
  }
}, { 
  timestamps: true 
});

// Index for faster queries
answerSchema.index({ sessionId: 1, questionIndex: 1 });

module.exports = mongoose.model('Answer', answerSchema);