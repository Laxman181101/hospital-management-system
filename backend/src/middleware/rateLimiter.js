const rateLimit = require('express-rate-limit');

// General rate limiter for login/auth routes to prevent brute-force attacks
const authRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 10 requests per `windowMs`
    message: {
        success: false,
        message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = {
    authRateLimiter
};
