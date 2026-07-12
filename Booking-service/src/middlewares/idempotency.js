/*
 * Idempotency Middleware
 *
 * Protects state-changing endpoints (e.g. makePayment) from being executed
 * more than once for the same logical request — even if the client retries
 * due to a network timeout, double-click, or frontend bug.
 *
 * How it works:
 *  1. Client generates a UUID before making the request and sends it as:
 *       Idempotency-Key: <uuid>
 *  2. Middleware checks Redis for that key.
 *     - Key EXISTS   → return the cached response immediately, skip handler
 *     - Key MISSING  → let request through, intercept the response,
 *                      cache { statusCode, body } in Redis with a 24hr TTL
 *
 * Why 24 hours TTL:
 *  - Retries for a payment almost never happen after 24 hours.
 *  - Keeps Redis memory bounded — keys expire automatically.
 *
 * Why we intercept res.json:
 *  - Express doesn't expose a built-in "after response" hook.
 *  - We wrap res.json so we can capture the status code and body
 *    at the exact moment the handler sends its response, then store it.
 */

const { RedisClient } = require('../config');

async function idempotencyMiddleware(req, res, next) {
    const key = req.headers['idempotency-key'];

    // If no key provided, reject the request — the client must supply one
    if (!key) {
        return res.status(400).json({
            message: 'Idempotency-Key header is required for this endpoint'
        });
    }

    const redisKey = `idempotency:${key}`;

    try {
        const cached = await RedisClient.get(redisKey);

        if (cached) {
            // We've seen this key before — return the original response
            const { statusCode, body } = JSON.parse(cached);
            res.set('X-Request-Cached', 'true');
            return res.status(statusCode).json(body);
        }

        // Key not seen before — intercept res.json to capture the response
        const originalJson = res.json.bind(res);
        res.json = async (body) => {
            // Only cache successful responses (2xx)
            // Failed requests should NOT be cached — client must be able to retry
            // with the same key after fixing the issue (e.g. wrong totalCost)
            if(res.statusCode >= 200 && res.statusCode < 300) {
                await RedisClient.setex(
                    redisKey,
                    86400,
                    JSON.stringify({ statusCode: res.statusCode, body })
                );
            }
            return originalJson(body);
        };

        next();
    } catch (error) {
        // If Redis is down, fail open — let the request through
        // A Redis outage should not bring down the payment endpoint
        console.error('Idempotency middleware Redis error:', error);
        next();
    }
}

module.exports = idempotencyMiddleware;
