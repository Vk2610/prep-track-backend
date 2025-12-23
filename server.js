require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimiter');

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmet()); // Set security HTTP headers

// Middleware
app.use(express.json({ limit: '10mb' })); // Body parser with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL-encoded data with size limit

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

// Apply rate limiting to all routes
if (process.env.NODE_ENV === 'production') {
    app.use('/api/', apiLimiter);
}

// Test route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'PrepTrack API is running',
        timestamp: new Date().toISOString()
    });
});

// Mount routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tracker', require('./routes/dailyTrackerRoutes'));
app.use('/api/mock', require('./routes/mockTrackerRoutes'));
app.use('/api/analysis', require('./routes/mockAnalysisRoutes'));
app.use('/api/softskills', require('./routes/softSkillsRoutes'));
app.use('/api/insights', require('./routes/insightsRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error(`❌ Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
});
