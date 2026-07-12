const { Router } = require('express');
const { register, login, logout } = require('../../controllers/auth-controller');
const { authenticate } = require('../../middlewares/auth-middleware');
const { rateLimiter } = require('../../middlewares/rate-limiter');

const router = Router();

router.post('/register', rateLimiter, register);
router.post('/login', rateLimiter, login);
router.post('/logout', authenticate, logout);

module.exports = router;
