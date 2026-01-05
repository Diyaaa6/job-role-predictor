
const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  degree: String,
  specialization: String,
  cgpa: Number,
  cgpaOutOf: String,
  yearOfGraduation: Number,
  employmentType: String,
  certifications: { type: [String], default: [] }, 
  internship: String,
  projects: Number,
  skills: [String],

  predictedJobRole: String,
  matchPercentage: Number,
  topMatches: Array,

  isFlagged: { type: Boolean, default: false },
  userRating: { type: Number, default: 0 },
  userComment: { type: String, default: "" },

  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: String,
  passwordHash: String,
  profilePic: { type: String, default: "" },
  googleId: String,
  provider: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  education: predictionSchema,
  educationHistory: [predictionSchema]
});

const RetrainingSchema = new mongoose.Schema({
    fileName: String,
    accuracy: Number,
    trainedAt: { type: Date, default: Date.now },
    modelPath: String, 
    isActive: { type: Boolean, default: false }
});
const Retraining = mongoose.model('Retraining', RetrainingSchema);

module.exports = mongoose.model('User', userSchema);