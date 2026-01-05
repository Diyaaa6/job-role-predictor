const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  degree: String,
  specialization: String,
  cgpa: Number,
  cgpaOutOf: String,
  yearOfGraduation: Number,
  employmentType: String,
  certifications: String,
  internship: String,
  projects: Number,
  skills: [String],

  predictedJobRole: String,
  matchPercentage: Number,
  topMatches: Array,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: String,
  passwordHash: String,
  googleId: String,
  provider: String,

  educationHistory: [predictionSchema]  
});

module.exports = mongoose.model('User', userSchema);
