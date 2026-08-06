const { verifyToken } = require('../config/jwt');
const Auth = require('../modules/auth/auth.model');

const protect = async (req, res, next) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1];
            const decoded = verifyToken(token);
            
            // Validate user exists and is active/approved in real-time
            const user = await Auth.findById(decoded.sub);
            if (!user || !user.isApproved) {
                return res.status(401).json({ message: 'Not authorized, user is deactivated or does not exist' });
            }
            
            req.user = decoded;
            return next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    return res.status(401).json({ message: 'Not authorized, no token' });
};

module.exports = { protect };
