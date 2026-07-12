const amqp = require('amqplib');
const { RABBITMQ_URL } = require('./server-config');

let channel = null;

/*
 * connectRabbitMQ
 *
 * Establishes a connection and channel to RabbitMQ.
 * Asserts the booking.confirmed queue as durable so messages
 * survive a RabbitMQ restart if the service is temporarily down.
 *
 * Attaches an error handler on the connection so a heartbeat
 * timeout or dropped connection doesn't crash the process.
 * On error, attempts to reconnect after 5 seconds.
 */
async function connectRabbitMQ() {
    const connection = await amqp.connect(RABBITMQ_URL);

    // Handle connection errors (e.g. heartbeat timeout) without crashing.
    // Reconnect after 5 seconds so the service self-heals.
    connection.on('error', (err) => {
        console.error('RabbitMQ connection error:', err.message);
        setTimeout(connectRabbitMQ, 5000);
    });

    connection.on('close', () => {
        console.warn('RabbitMQ connection closed — reconnecting in 5s');
        setTimeout(connectRabbitMQ, 5000);
    });

    channel = await connection.createChannel();
    await channel.assertQueue('booking.confirmed', { durable: true });
    console.log('RabbitMQ connected');
}

function getChannel() {
    return channel;
}

module.exports = { connectRabbitMQ, getChannel };
