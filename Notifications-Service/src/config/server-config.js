const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FROM_EMAIL:     process.env.FROM_EMAIL || 'onboarding@resend.dev',
    RABBITMQ_URL:   process.env.RABBITMQ_URL || 'amqp://localhost',
};
