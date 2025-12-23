/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Server Error';

    // Mongoose duplicate key error (E11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
        statusCode = 400;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        message = errors.join(', ');
        statusCode = 400;
    }

    // Mongoose bad ObjectId (CastError)
    if (err.name === 'CastError') {
        message = `Resource not found`;
        statusCode = 404;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        message = 'Invalid token. Please login again.';
        statusCode = 401;
    }

    if (err.name === 'TokenExpiredError') {
        message = 'Token expired. Please login again.';
        statusCode = 401;
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error:', err);
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
