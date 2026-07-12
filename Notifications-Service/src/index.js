/*
 * Notifications Service — Entry Point
 *
 * A lightweight event-driven microservice with no HTTP server.
 * It connects to RabbitMQ and listens for events published by other services:
 *
 *   booking.confirmed → send booking confirmation email via Resend
 *
 * There is no Express server here — this service is purely a queue consumer.
 * It stays alive as long as the RabbitMQ connection is open.
 */

const { RabbitMQ } = require('./config');
const { subscribeBookingConfirmed } = require('./subscribers/booking-confirmed');

async function start() {
    try {
        await RabbitMQ.connectRabbitMQ();

        await subscribeBookingConfirmed();

        console.log('Notifications Service running');
    } catch (err) {
        console.error('Failed to start Notifications Service:', err.message);
        process.exit(1);
    }
}

start();
