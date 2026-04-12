const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    default: 'My Resume'
  },
  resumeData: {
    personalInfo: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
      location: { type: String },
      linkedin: { type: String },
      github: { type: String },
      website: { type: String },
      profilePicture: { type: String }
    },
    summary: { type: String },
    experience: [{
      title: { type: String },
      company: { type: String },
      duration: { type: String },
      location: { type: String },
      description: { type: String }
    }],
    education: [{
      degree: { type: String },
      institution: { type: String },
      year: { type: String },
      gpa: { type: String },
      description: { type: String }
    }],
    skills: {
      technical: [{ type: String }],
      soft: [{ type: String }]
    },
    projects: [{
      title: { type: String },
      description: { type: String },
      technologies: [{ type: String }],
      link: { type: String },
      duration: { type: String }
    }],
    certifications: [{
      name: { type: String },
      issuer: { type: String },
      date: { type: String },
      link: { type: String }
    }],
    achievements: [{
      title: { type: String },
      description: { type: String },
      date: { type: String }
    }]
  },
  atsScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  template: {
    type: String,
    enum: ['modern', 'classic', 'creative', 'minimal'],
    default: 'modern'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastGenerated: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
resumeSchema.index({ userId: 1, updatedAt: -1 });
resumeSchema.index({ atsScore: -1 });
resumeSchema.index({ createdAt: -1 });

// Update timestamp on save
resumeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for resume completeness percentage
resumeSchema.virtual('completeness').get(function() {
  let completed = 0;
  let total = 0;

  // Personal info (required fields)
  const requiredPersonal = ['fullName', 'email', 'phone', 'location'];
  requiredPersonal.forEach(field => {
    total++;
    if (this.resumeData.personalInfo[field]) completed++;
  });

  // Summary
  total++;
  if (this.resumeData.summary && this.resumeData.summary.trim().length > 50) completed++;

  // Experience
  total++;
  if (this.resumeData.experience && this.resumeData.experience.length >= 1) completed++;

  // Education
  total++;
  if (this.resumeData.education && this.resumeData.education.length >= 1) completed++;

  // Skills
  total++;
  const totalSkills = (this.resumeData.skills?.technical?.length || 0) + 
                     (this.resumeData.skills?.soft?.length || 0);
  if (totalSkills >= 5) completed++;

  return Math.round((completed / total) * 100);
});

// Method to increment download count
resumeSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  this.lastGenerated = new Date();
  return this.save();
};

module.exports = mongoose.model('Resume', resumeSchema);