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

// Initialize Daily Reminder Job
const initReminderJob = require('./utils/reminderJob');
initReminderJob();

// Security Middleware
app.use(helmet()); // Set security HTTP headers

// Middleware
app.use(express.json({ limit: '10mb' })); // Body parser with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL-encoded data with size limit

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
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
app.use('/api/notifications', require('./routes/notificationRoutes'));

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
