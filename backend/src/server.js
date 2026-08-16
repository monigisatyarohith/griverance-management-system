const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const { FRONTEND_URL } = require('./config/constants');

// Import models (this sets up associations)
const { sequelize } = require('./models');

const app = express();

// Security middleware
app.use(helmet());

const configuredFrontendUrl = (FRONTEND_URL || '').replace(/\/$/, '');

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    if (
      cleanOrigin === configuredFrontendUrl ||
      cleanOrigin.includes('localhost') ||
      cleanOrigin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
const fs = require('fs');
const os = require('os');

const serverlessUploadDir = path.join(os.tmpdir(), 'uploads');
const localUploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(serverlessUploadDir)) {
  try {
    fs.mkdirSync(serverlessUploadDir, { recursive: true });
  } catch (e) {
    // ignore
  }
}
if (!fs.existsSync(localUploadDir)) {
  try {
    fs.mkdirSync(localUploadDir, { recursive: true });
  } catch (e) {
    // ignore
  }
}

app.use('/uploads', express.static(serverlessUploadDir));
app.use('/uploads', express.static(localUploadDir));

// Sync database on first request (for serverless)
let dbSynced = false;
app.use(async (req, res, next) => {
  if (!dbSynced) {
    try {
      await sequelize.sync();
      dbSynced = true;
    } catch (err) {
      console.error('DB sync error:', err.message);
    }
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Only listen when running locally (not on Vercel)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  sequelize.sync()
    .then(() => {
      console.log('✅ Database synced successfully');
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ Database sync error:', err.message);
      process.exit(1);
    });
}

module.exports = app;
