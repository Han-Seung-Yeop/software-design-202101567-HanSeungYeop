const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const gradeRoutes = require('./routes/grades');
const attendanceRoutes = require('./routes/attendances');
const behaviorRoutes = require('./routes/behaviors');
const attitudeRoutes = require('./routes/attitudes');
const specialNoteRoutes = require('./routes/specialNotes');
const feedbackRoutes = require('./routes/feedbacks');
const counselingRoutes = require('./routes/counselings');

const app = express();

// Middleware
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

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
