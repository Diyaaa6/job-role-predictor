require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const Joi = require('joi');
const mongoose = require('mongoose');
const { spawn } = require('child_process');
const multer = require('multer'); 
const router = express.Router();
const fs = require('fs');

const uploadPaths = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads', 'profiles'),
    path.join(__dirname, 'uploads', 'resumes')
];

uploadPaths.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`>>> Created directory: ${dir}`);
    }
});
const datasetDir = path.join(__dirname, 'uploads', 'datasets');
if (!fs.existsSync(datasetDir)) {
    fs.mkdirSync(datasetDir, { recursive: true });
}

const connectDB = require('./db');
const User = require('./User');

const app = express();
const PORT = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);


const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jobrole';
connectDB(MONGO_URI);


app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use((req, res, next) => {
  console.log(`>>> ${req.method} request to ${req.url}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token required' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("JWT verification failed:", err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.userId = decoded.id;
    next();
  });
}

app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) return res.status(400).json({ message: "All fields are required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, username, passwordHash: hashedPassword });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.status(201).json({ message: 'User registered successfully', token });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (!user.passwordHash) return res.status(401).json({ message: "Login with Google instead" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});


app.post('/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Google token missing" });

    const ticket = await googleClient.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { email, sub, name } = payload;

    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = sub;
        user.provider = 'google+password';
        await user.save();
      }
    } else {
      user = await User.create({ email, username: name, googleId: sub, provider: 'google' });
    }

    const jwtToken = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ message: "Google login successful", token: jwtToken });
  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(401).json({ message: "Google authentication failed" });
  }
});


app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        profilePic: user.profilePic || "", 
        education: user.education || {},
        educationHistory: user.educationHistory || [] 
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Unable to fetch profile' });
  }
});

const picStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/profiles/'),
  filename: (req, file, cb) => {
    cb(null, req.userId + '-' + Date.now() + path.extname(file.originalname));
  }
});
const uploadPic = multer({ storage: picStorage });


app.post('/profile/upload-pic', authenticateToken, uploadPic.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    
    const picPath = `/uploads/profiles/${req.file.filename}`;
    await User.findByIdAndUpdate(req.userId, { profilePic: picPath });
    
    res.json({ message: "Upload successful", profilePic: picPath });
  } catch (err) {
    res.status(500).json({ message: "Server error during upload" });
  }
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.delete('/profile/remove-pic', authenticateToken, async (req, res) => {
    try {

        await User.findByIdAndUpdate(req.userId, { 
            $set: { profilePic: "" } 
        });

        res.status(200).json({ message: "Profile picture removed from database" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ message: "Server error during deletion" });
    }
});



const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin rights required." });
    }

    req.userId = user._id;
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};



const datasetUpload = multer({ dest: 'uploads/datasets/' });
const upload = multer({ dest: 'uploads/datasets/' });

router.post('/admin/upload-dataset', authenticateAdmin, upload.single('dataset'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });
        console.log("Received dataset:", req.file.path);

        res.status(200).json({ 
            message: "Dataset received and ready for retraining",
            fileName: req.file.originalname 
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});


const educationSchema = Joi.object({
  degree: Joi.string().required(),
  specialization: Joi.string().required(),
  cgpa: Joi.number().required(),
  cgpaOutOf: Joi.string().valid('4', '5', '10').required(),
  yearOfGraduation: Joi.number().required(),
  certifications: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string().allow('')).optional(),
  projects: Joi.number().default(0),
  internship: Joi.string().valid('Yes', 'No').required(),
  skills: Joi.array().items(Joi.string()).optional(), 
});


app.post('/education/add', authenticateToken, async (req, res) => {
    console.log("1. Received education/add request");
    try {
        const { error, value } = educationSchema.validate(req.body);
        if (error) {
            console.log("2. Joi Validation Error:", error.details[0].message);
            return res.status(400).json({ message: error.details[0].message });
        }

        const python = spawn(
            'C:\\Users\\User\\AppData\\Local\\Programs\\Python\\Python314\\python.exe',
            [path.join(__dirname, 'scripts', 'predict_jobrole.py'), JSON.stringify(value)],
            { env: { ...process.env, OMP_NUM_THREADS: '1', MKL_NUM_THREADS: '1' } }
        );

        let output = '', errorOutput = '';
        python.stdout.on('data', (data) => { output += data.toString(); });
        python.stderr.on('data', (data) => { errorOutput += data.toString(); });

        python.on('close', async (code) => {
            if (code !== 0) return res.status(500).json({ message: 'Prediction script failed' });

            try {
                const cleanOutput = output.trim().split('\n').pop();
                const prediction = JSON.parse(cleanOutput);
                const user = await User.findById(req.userId);
                
                const newEntry = {
                    ...value,
                    predictedJobRole: prediction.predicted_job_role || "Pending",
                    matchPercentage: prediction.match_percentage || 0,
                    topMatches: prediction.top_3_matches || [],
                    isFlagged: false, 
                    createdAt: new Date()
                };

                user.educationHistory.push(newEntry);
                
                const savedEntry = user.educationHistory[user.educationHistory.length - 1];
                user.education = savedEntry; 
                
                await user.save();
                res.json({ message: 'Success', prediction });

            } catch (err) {
                res.status(500).json({ message: 'Failed to save results' });
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/education/history', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('educationHistory');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      totalPredictions: user.educationHistory.length,
      history: [...user.educationHistory].reverse()
    });
  } catch (err) {
    console.error("Education History Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/stats/degree-job', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({}, 'educationHistory');

    const counts = {};

    users.forEach(u => {
      u.educationHistory.forEach(h => {
        const degree = h.degree;
        h.topMatches.forEach(m => {
          const role = m.role;
          if (!counts[degree]) counts[degree] = {};
          counts[degree][role] = (counts[degree][role] || 0) + 1;
        });
      });
    });

    res.json(counts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to build degree-job stats' });
  }
});

const ROLE_DOMAIN = {
  "Software Engineer": "IT",
  "Web Developer": "Web",
  "Data Analyst": "Data",
  "ML Engineer": "Data",
  "Cyber Security Analyst": "Security"
};

app.get('/stats/job-domains', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({}, 'educationHistory');
    const domainCount = {};

    users.forEach(u => {
      u.educationHistory.forEach(h => {
        h.topMatches.forEach(m => {
          const domain = ROLE_DOMAIN[m.role] || 'Other';
          domainCount[domain] = (domainCount[domain] || 0) + 1;
        });
      });
    });

    res.json(domainCount);
  } catch {
    res.status(500).json({ message: 'Failed to build domain stats' });
  }
});


app.get('/education/insights', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.education) return res.status(404).json({ message: "No profile found" });

    const { degree, predictedJobRole, cgpa, projects } = user.education;

    const peersWithSameRole = await User.find({ 
      "education.predictedJobRole": predictedJobRole 
    });

    if (peersWithSameRole.length === 0) {
      return res.json({ insightText: "Not enough data for peer comparison.", peerCount: 0 });
    }

    const avgCGPA = peersWithSameRole.reduce((acc, p) => acc + (p.education.cgpa || 0), 0) / peersWithSameRole.length;
    const avgProjects = peersWithSameRole.reduce((acc, p) => acc + (p.education.projects || 0), 0) / peersWithSameRole.length;

    res.json({
      predictedRole: predictedJobRole,
      userStats: { cgpa, projects },
      peerAverages: { 
        cgpa: avgCGPA.toFixed(2), 
        projects: Math.round(avgProjects) 
      },
      peerCount: peersWithSameRole.length,
      insightText: `${Math.round((peersWithSameRole.length / (await User.countDocuments())) * 100)}% of students were also matched with ${predictedJobRole}.`
    });
  } catch (err) {
    res.status(500).json({ message: "Error generating stack-up insights" });
  }
});


app.get('/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });

    const allUsers = await User.find({ role: 'user' }).select('username email educationHistory');
    
    const historyData = allUsers.flatMap(u => u.educationHistory);
    
    res.json({
      totalUsers,
      totalPredictions: historyData.length,
      users: allUsers
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch admin stats" });
  }
});

app.get('/admin/flagged-predictions', authenticateAdmin, async (req, res) => {
  const users = await User.find(
    { 'educationHistory.isFlagged': true },
    'username email educationHistory'
  );

  const flagged = users.flatMap(u =>
    u.educationHistory.filter(h => h.isFlagged)
  );

  res.json(flagged);
});
app.get('/admin/flagged-count', authenticateAdmin, async (req, res) => {
  const count = await User.countDocuments({
    'educationHistory.isFlagged': true
  });
  res.json({ flaggedCount: count });
});


app.post('/admin/retrain', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const datasetDir = path.join(__dirname, 'uploads', 'datasets');
    const archiveDir = path.join(__dirname, 'models_archive');
    const MODEL_DIR = path.join(__dirname, 'model');

    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    const files = fs.readdirSync(datasetDir).filter(f => f.endsWith('.csv'));
    if (files.length === 0) {
      return res.status(400).json({ message: "No CSV found." });
    }

    const latestFile = files
      .map(f => ({ name: f, time: fs.statSync(path.join(datasetDir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time)[0].name;


    let archivedPath = null;
    if (fs.existsSync(MODEL_DIR)) {
      const timestamp = Date.now();
      archivedPath = path.join(archiveDir, `model_v_${timestamp}`);
      fs.cpSync(MODEL_DIR, archivedPath, { recursive: true });
      fs.rmSync(MODEL_DIR, { recursive: true, force: true });
    }

    const pythonPath = 'C:\\Users\\User\\AppData\\Local\\Programs\\Python\\Python314\\python.exe';
    const scriptPath = path.join(__dirname, 'scripts', 'admin_train.py');

    const python = spawn(pythonPath, [scriptPath, path.join(datasetDir, latestFile)]);
    let output = '';

    python.stdout.on('data', data => output += data.toString());

    python.on('close', async (code) => {
      if (code !== 0) {
        return res.status(500).json({ message: "Training failed" });
      }

      const match = output.match(/Accuracy:\s*(\d+(\.\d+)?)/);
      const accuracy = match ? parseFloat(match[1]) : 0;


      const historyEntry = await Retraining.create({
        fileName: latestFile,
        accuracy,
        modelPath: archivedPath,  
        isActive: true
      });

      await Retraining.updateMany(
        { _id: { $ne: historyEntry._id } },
        { isActive: false }
      );

      res.json({
        message: "✅ Model retrained successfully",
        accuracy
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


app.post('/admin/restore-model', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { historyId } = req.body;
        const target = await Retraining.findById(historyId);
        if (!target) return res.status(404).json({ message: "Version not found in database" });

        const activeModelFolder = path.join(__dirname, 'model'); 

        if (fs.existsSync(target.modelPath)) {
            if (fs.existsSync(activeModelFolder)) {
                fs.rmSync(activeModelFolder, { recursive: true, force: true });
            }
            fs.cpSync(target.modelPath, activeModelFolder, { recursive: true });

            await Retraining.updateMany({}, { isActive: false });
            target.isActive = true;
            await target.save();
            
            res.json({ message: "Model Restored Successfully!", accuracy: target.accuracy });
        } else {
            res.status(400).json({ message: "Physical model folder missing on server disk" });
        }
    } catch (err) {
        res.status(500).json({ message: "Restore failed" });
    }
});

const retrainingSchema = new mongoose.Schema({
    fileName: String,
    accuracy: Number,
    trainedAt: { type: Date, default: Date.now },
    modelPath: String,
    isActive: { type: Boolean, default: false }
});

const Retraining = mongoose.models.Retraining || mongoose.model('Retraining', retrainingSchema);

app.get('/admin/retrain-history', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const history = await Retraining.find().sort({ trainedAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch model library" });
    }
});

app.get('/admin/feedback-analytics', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const users = await User.find({}, 'username educationHistory');
        const roleStats = {};
        const detailedFeedback = [];

        users.forEach(user => {
            user.educationHistory.forEach(pred => {
                if (pred.userRating || pred.userComment) {
                    const role = pred.predictedJobRole || "Unknown";

                    if (pred.userRating) {
                        if (!roleStats[role]) roleStats[role] = { totalRating: 0, count: 0 };
                        roleStats[role].totalRating += pred.userRating;
                        roleStats[role].count += 1;
                    }

                    detailedFeedback.push({
                        username: user.username,
                        predictedRole: role,
                        rating: pred.userRating || 0,
                        comment: pred.userComment || "No written comment provided.",
                        date: pred.createdAt
                    });
                }
            });
        });

        const labels = Object.keys(roleStats);
        const chartData = labels.map(role => (roleStats[role].totalRating / roleStats[role].count).toFixed(1));
        detailedFeedback.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ labels, chartData, detailedFeedback });
    } catch (err) {
        res.status(500).json({ message: "Error fetching feedback analytics" });
    }
});

const datasetStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/datasets/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.csv');
    }
});

const uploadDataset = multer({ storage: datasetStorage });

app.post('/admin/upload-dataset', authenticateAdmin, uploadDataset.single('dataset'), async (req, res) => {
    
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file received by server" });
        }
        
        console.log(`>>> Received CSV: ${req.file.originalname} saved at ${req.file.path}`);
        
        res.status(200).json({ 
            message: "Dataset uploaded successfully", 
            fileName: req.file.filename 
        });
    } catch (error) {
        console.error("Admin Upload Error:", error);
        res.status(500).json({ message: "Internal server error during upload" });
    }
});


app.post('/education/flag', authenticateToken, async (req, res) => {
    try {
        const { predictionId } = req.body;
        const user = await User.findById(req.userId);

        const prediction = user.educationHistory.id(predictionId);
        if (!prediction) return res.status(404).json({ message: "Prediction not found" });

        prediction.isFlagged = true;

        if (user.education && user.education._id.toString() === predictionId) {
            user.education.isFlagged = true;
        }

        await user.save();
        res.json({ message: "Prediction flagged successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error while flagging" });
    }
});

app.post('/feedback/submit', authenticateToken, async (req, res) => {
  try {
    const { predictionId, rating, comment } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const prediction = user.educationHistory.id(predictionId);
    
    if (prediction) {

      prediction.userRating = Number(rating);
      prediction.userComment = comment;

      if (user.education && user.education._id.toString() === predictionId) {
        user.education.userRating = Number(rating);
        user.education.userComment = comment;
      }

      await user.save();
      res.json({ message: "Feedback saved to database!" });
    } else {
      res.status(404).json({ message: "Prediction record not found" });
    }
  } catch (err) {
    console.error("Feedback Storage Error:", err);
    res.status(500).json({ message: "Server error saving feedback" });
  }
});

app.get('/stats/sankey-data', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({}, 'educationHistory');
    const flows = {};

    users.forEach(u => {
      u.educationHistory.forEach(h => {
        if (h.degree && h.predictedJobRole) {
          const key = `${h.degree} → ${h.predictedJobRole}`;
          flows[key] = (flows[key] || 0) + 1;
        }
      });
    });

    const chartData = Object.keys(flows).map(key => {
      const [from, to] = key.split(' → ');
      return [from, to, flows[key]];
    });

    res.json(chartData);
  } catch (err) {
    res.status(500).json({ message: 'Error formatting Sankey data' });
  }
});

app.get('/stats/my-career-flows', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.education?.degree) {
      return res.status(400).json({ message: "No degree found in profile" });
    }

    const userDegree = user.education.degree;
    const peers = await User.find({ "education.degree": userDegree }, 'educationHistory');
    
    const flows = {};
    peers.forEach(p => {
      p.educationHistory.forEach(h => {
        if (h.degree === userDegree && h.predictedJobRole) {
          const to = h.predictedJobRole;
          flows[to] = (flows[to] || 0) + 1;
        }
      });
    });

    const chartData = Object.keys(flows).map(role => [userDegree, role, flows[role]]);

    res.json(chartData);
  } catch (err) {
    res.status(500).json({ message: 'Error generating career flows' });
  }
});


const FRONTEND_PATH = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_PATH));

app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.stack);
  res.status(500).json({ message: "Internal Server Error", error: err.message });
});
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
