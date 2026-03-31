const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  sessionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Session', 
    required: true,
    unique: true // Only one analysis per session
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  strengths: [String],
  improvements: [String],
  detailedAnalysis: String,
  recommendations: [String],
  isGenerated: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Index for faster queries
analysisSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Analysis', analysisSchema);