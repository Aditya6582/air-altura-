const Redis = require('ioredis');
const { REDIS_HOST, REDIS_PORT } = require('./server-config');

const redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, { lazyConnect: true })
    : new Redis({
        host: REDIS_HOST,
        port: REDIS_PORT,
        lazyConnect: true,
    });

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err.message));

module.exports = redis;
