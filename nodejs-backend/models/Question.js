const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  sessionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Session', 
    required: true 
  },
  questionText: { 
    type: String, 
    required: true 
  },
  questionIndex: { 
    type: Number, 
    required: true 
  }
}, { 
  timestamps: true 
});

// Index for faster queries
questionSchema.index({ sessionId: 1, questionIndex: 1 });

module.exports = mongoose.model('Question', questionSchema);