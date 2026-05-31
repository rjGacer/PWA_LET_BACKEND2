require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const categoryRoutes = require('./routes/categories');
const subjectRoutes = require('./routes/subjects');
const questionRoutes = require('./routes/questions');
const quizRoutes = require('./routes/quizzes');
const moduleRoutes = require('./routes/modules');
const performanceRoutes = require('./routes/performance');
const uploadRoutes = require('./routes/upload');
const syncRoutes = require('./routes/sync');
const teacherRoutes = require('./routes/teachers');
const sessionRoutes = require('./routes/sessions');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/students`, studentRoutes);
app.use(`${apiPrefix}/categories`, categoryRoutes);
app.use(`${apiPrefix}/subjects`, subjectRoutes);
app.use(`${apiPrefix}/questions`, questionRoutes);
app.use(`${apiPrefix}/quizzes`, quizRoutes);
app.use(`${apiPrefix}/modules`, moduleRoutes);
app.use(`${apiPrefix}/performance`, performanceRoutes);
app.use(`${apiPrefix}/upload`, uploadRoutes);
app.use(`${apiPrefix}/sync`, syncRoutes);
app.use(`${apiPrefix}/teachers`, teacherRoutes);
app.use(`${apiPrefix}/sessions`, sessionRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 PWA LET Teacher Backend Server`);
  console.log(`📍 Running on http://localhost:${PORT}`);
  console.log(`📡 API Prefix: ${apiPrefix}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || '*'}`);
  console.log(`✓ Ready to accept requests\n`);
});
