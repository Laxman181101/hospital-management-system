const jwt = require('jsonwebtoken');
const env = require('../config/env');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access denied. Token is empty.' });
        }

        const jwtSecret = env.jwtSecret || process.env.JWT_SECRET;
        const decoded = jwt.verify(token, jwtSecret);
        // Attach decoded user (id, role) to req.user
        req.user = {
            id: decoded.id || decoded.sub,
            role: decoded.role
        };
        
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

module.exports = authMiddleware;
