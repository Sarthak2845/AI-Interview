const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    default: '1', 
    required: true 
  },
  name: String,
  email: String
}, { 
  timestamps: true 
});

module.exports = mongoose.model('User', userSchema);