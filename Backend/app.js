const express = require('express');
const cookieParser = require('cookie-parser');
const errorMiddleware = require('./middleware/error.middleware');
const authRoutes = require('./routes/auth.routes');
const patientRoutes = require('./routes/patient.routes');
const adminRoutes = require('./routes/admin.routes');
const screeningRoutes = require('./routes/screening.routes');
const reviewRoutes = require('./routes/review.routes');
const logger = require('./middleware/logger.middleware');
const cors = require('cors');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(logger);
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);

// Patient routes
app.use('/api/patients', patientRoutes);
app.use('/api/v1/patients', patientRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);
app.use('/api/v1/admin', adminRoutes);

// Screening routes
app.use('/api/screenings', screeningRoutes);
app.use('/api/v1/screenings', screeningRoutes);

// Doctor clinical review routes
app.use('/api/reviews', reviewRoutes);
app.use('/api/v1/reviews', reviewRoutes);

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;
