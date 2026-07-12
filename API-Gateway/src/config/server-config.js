const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    PORT: process.env.PORT || 5000,
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    DB_DIALECT: process.env.DB_DIALECT || 'mysql',
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRY: process.env.JWT_EXPIRY || '1h',
    FLIGHTS_SERVICE: process.env.FLIGHTS_SERVICE || 'http://localhost:3000',
    BOOKING_SERVICE: process.env.BOOKING_SERVICE || 'http://localhost:4000',
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT) || 6379,
    SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS) || 10,
};
