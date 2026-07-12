const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const redis = require('../config/redis-config');
const { JWT_SECRET } = require('../config/server-config');

async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'No token provided' });
        }

        try {
            const blacklisted = await redis.get(`blacklist:${token}`);
            if (blacklisted) {
                return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Token has been invalidated' });
            }
        } catch {
            // Redis down — skip blacklist check, fail open
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        // Forward userId to downstream services via header
        req.headers['x-user-id']    = String(decoded.id);
        req.headers['x-user-email'] = decoded.email;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Token expired' });
        }
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid token' });
    }
}

module.exports = { authenticate };
