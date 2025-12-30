const express = require('express');
const cors = require('cors');
const multer = require('multer');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { extractText } = require('./services/parser');
const { analyzeResume } = require('./services/ollamaService');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',  // Vite dev server
  'http://localhost:5174',
  'http://localhost:3000',
  'https://resume-app-fawn-eight.vercel.app',
];

// Remove undefined/null values
const validOrigins = allowedOrigins.filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (validOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(morgan('dev')); // Logger
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File Upload Config (Memory Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Analyze Route
app.post('/analyze', upload.fields([{ name: 'resume' }, { name: 'jd' }]), async (req, res) => {
  try {
    const files = req.files || {};
    const resumeFile = files.resume ? files.resume[0] : null;
    const jdFile = files.jd ? files.jd[0] : null;

    let resumeText = req.body.resumeText || '';
    let jdText = req.body.jdText || '';

    console.log('[Analyze Request] Resume File:', resumeFile ? resumeFile.originalname : 'None',
      'JD File:', jdFile ? jdFile.originalname : 'None');
    // 1. Extract Text from Files
    if (resumeFile) {
      resumeText = await extractText(resumeFile);
    }
    if (jdFile) {
      jdText = await extractText(jdFile);
    }

    // 2. Validation
    if (!resumeText.trim()) {
      return res.status(400).json({ error: 'Resume text or file is required.' });
    }
    if (!jdText.trim()) {
      return res.status(400).json({ error: 'Job description text or file is required.' });
    }

    // 3. AI Analysis
    const result = await analyzeResume(resumeText, jdText);

    res.json(result);

  } catch (error) {
    console.error('[Analyze Error]', error.message);
    // Determine status code based on error type
    const status = error.message.includes('No file') ? 400 : 500;
    res.status(status).json({ error: error.message || 'Internal Server Error' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Using Ollama Model: ${process.env.OLLAMA_MODEL || 'llama3'}`);
});