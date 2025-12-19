// backend/middleware/errorMiddleware.js

// Middleware for 404 Not Found errors
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Global Error Handler
const errorHandler = (err, req, res, next) => {
    // Check if the response status code was set by a previous error handling function
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode; 
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : null, // Show stack trace only in dev
    });
};

export { notFound, errorHandler };