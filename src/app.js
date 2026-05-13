const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');
const ResponseUtils = require('./utils/response.utils');

const app = express();

// ─── Security Headers ──────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ──────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      'http://localhost:8081',  // Expo web
      'http://localhost:3000',  // other local
      'https://your-frontend.com', // production
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── Body Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logging ───────────────────────────────────────────────────────
if (config.env !== 'test') {
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
}

// ─── Global Rate Limiter ───────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later' },
  })
);

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  return ResponseUtils.success(res, {
    status: 'healthy',
    env: config.env,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// ─── Root ──────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  return ResponseUtils.success(res, {
    name: 'Auth API',
    version: '1.0.0',
    docs: '/health',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
    },
  });
});

// ─── Error Handling ────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
