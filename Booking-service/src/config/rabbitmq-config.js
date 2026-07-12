/*
 * RabbitMQ Config — Booking Service
 *
 * Manages a single shared connection and channel for the entire service.
 * Both publisher and cron job use getChannel() to publish messages.
 *
 * Queues asserted here (durable: true = survive RabbitMQ restarts):
 *   - seat.restoration  : consumed by Flights Service to restore seats on cancellation
 *   - booking.confirmed : consumed by Reminder Service to send confirmation emails
 *
 * Why durable queues:
 *   If RabbitMQ restarts, durable queues and persistent messages survive.
 *   Without this, a RabbitMQ crash would lose all pending seat restoration events
 *   and consistency would break.
 */

const amqp = require('amqplib');

let channel = null;

async function connectRabbitMQ() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();

    await channel.assertQueue('seat.restoration', { durable: true });
    await channel.assertQueue('booking.confirmed', { durable: true });

    console.log('RabbitMQ connected successfully (Booking Service)');
    return channel;
}

function getChannel() {
    if (!channel) throw new Error('RabbitMQ channel not initialized — call connectRabbitMQ first');
    return channel;
}

module.exports = { connectRabbitMQ, getChannel };
