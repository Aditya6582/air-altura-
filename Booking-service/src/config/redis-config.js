const Redis = require('ioredis');

const client = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL)
    : new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
    });

client.on('connect', () => console.log('Redis connected successfully'));
client.on('error', (err) => console.error('Redis connection error:', err));

module.exports = client;
