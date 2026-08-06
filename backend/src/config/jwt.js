const jwt = require('jsonwebtoken');
const env = require('./env');

const generateToken = (payload, expiresIn = '8h') => { // Short-lived Access Token
    return jwt.sign(payload, env.jwtSecret, { expiresIn });
};

const verifyToken = (token) => {
    return jwt.verify(token, env.jwtSecret);
};

const generateRefreshToken = (payload, expiresIn = '7d') => { // Long-lived Refresh Token
    return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn });
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, env.jwtRefreshSecret);
};

module.exports = {
    generateToken,
    verifyToken,
    generateRefreshToken,
    verifyRefreshToken
};

