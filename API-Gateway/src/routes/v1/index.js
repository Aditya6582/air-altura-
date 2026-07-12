const { Router } = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { authenticate } = require('../../middlewares/auth-middleware');
const { rateLimiter } = require('../../middlewares/rate-limiter');
const authRouter = require('./auth-router');
const { FLIGHTS_SERVICE, BOOKING_SERVICE } = require('../../config/server-config');

const router = Router();

router.use('/auth', authRouter);

// Express strips the mounted prefix from req.url before the proxy sees it.
// Reuse the original incoming path so downstream services receive the versioned route.
const restorePath = {
    pathRewrite: (_path, req) => req.originalUrl,
};

const flightsProxy = createProxyMiddleware({
    target: FLIGHTS_SERVICE,
    changeOrigin: true,
    ...restorePath,
});

router.use('/flights', rateLimiter, flightsProxy);
router.use('/airplanes', rateLimiter, flightsProxy);
router.use('/airports', rateLimiter, flightsProxy);
router.use('/cities', rateLimiter, flightsProxy);

const bookingProxy = createProxyMiddleware({
    target: BOOKING_SERVICE,
    changeOrigin: true,
    ...restorePath,
});

router.use('/booking', rateLimiter, authenticate, bookingProxy);

module.exports = router;
