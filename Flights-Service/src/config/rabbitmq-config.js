/*
 * RabbitMQ Config — Flights Service
 *
 * Manages a single shared connection and channel for the entire service.
 * The seat restoration subscriber uses getChannel() to consume messages.
 *
 * Queues asserted here:
 *   - seat.restoration : published by Booking Service cron, consumed here to restore seats
 *
 * assertQueue is idempotent — safe to call on both publisher and consumer side.
 * Whichever service starts first will create the queue; the other just connects to it.
 */

const amqp = require('amqplib');

let channel = null;

async function connectRabbitMQ() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();

    await channel.assertQueue('seat.restoration', { durable: true });

    console.log('RabbitMQ connected successfully (Flights Service)');
    return channel;
}

function getChannel() {
    if (!channel) throw new Error('RabbitMQ channel not initialized — call connectRabbitMQ first');
    return channel;
}

module.exports = { connectRabbitMQ, getChannel };
