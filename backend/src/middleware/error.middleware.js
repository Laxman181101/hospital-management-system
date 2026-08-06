const env = require('../config/env');

const notFoundHandler = (req, res, next) => {
    res.status(404).json({ message: 'Route not found' });
};

const globalErrorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        ...(env.nodeEnv === 'development' && { stack: err.stack }),
    });
};

module.exports = { notFoundHandler, globalErrorHandler };
