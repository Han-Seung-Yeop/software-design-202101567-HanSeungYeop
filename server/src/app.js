const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const gradeRoutes = require('./routes/grades');
const attendanceRoutes = require('./routes/attendances');
const behaviorRoutes = require('./routes/behaviors');
const attitudeRoutes = require('./routes/attitudes');
const specialNoteRoutes = require('./routes/specialNotes');
const feedbackRoutes = require('./routes/feedbacks');
const counselingRoutes = require('./routes/counselings');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const parentInvitationRoutes = require('./routes/parentInvitations');
const analyticsRoutes = require('./routes/analytics');
const chatRoutes = require('./routes/chat');
const { generalLimiter } = require('./middlewares/rateLimit');

const app = express();

// ALB 뒤에서 실행되므로 X-Forwarded-For 신뢰 (express-rate-limit 오류 방지)
app.set('trust proxy', 1);

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

// Session (Passport OAuth state 처리용 - 짧게만 사용)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-only-fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 5 * 60 * 1000 },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// 전역 Rate Limiting (15분에 1000번 — DDoS 완화)
app.use('/api/', generalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/behaviors', behaviorRoutes);
app.use('/api/attitudes', attitudeRoutes);
app.use('/api/special-notes', specialNoteRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/counselings', counselingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/parent-invitations', parentInvitationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok' } });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다.',
    error: 'NOT_FOUND',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '서버 내부 오류가 발생했습니다.',
    error: err.code || 'INTERNAL_SERVER_ERROR',
  });
});

module.exports = app;
