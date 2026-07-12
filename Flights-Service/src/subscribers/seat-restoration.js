/*
 * Seat Restoration Subscriber
 *
 * Listens to the 'seat.restoration' queue published by the Booking Service cron job
 * whenever bookings are cancelled due to payment timeout.
 *
 * For each message:
 *  1. Parse the event: { bookingId, flightId, seats, seatClass }
 *  2. Call FlightService.updateSeats — routes to FlightClasses when seatClass is present,
 *     falls back to Flights.totalSeats for pre-v2 messages that lack a seatClass field.
 *  3. Acknowledge the message (ack) — RabbitMQ removes it from the queue
 *
 * On failure (Flight Service DB error etc.):
 *  - nack the message with requeue: true
 *  - RabbitMQ puts it back in the queue for retry
 *  - This guarantees seats are eventually restored even if something goes wrong
 *
 * Why this beats a direct HTTP call from the cron job:
 *  - If this service is down when cron fires, messages wait in the durable queue
 *  - When this service restarts, it processes all waiting messages automatically
 *  - No seats are permanently lost
 */

const { RabbitMQ } = require('../config');
const { FlightService } = require('../services');

async function subscribeSeatRestoration() {
    const channel = RabbitMQ.getChannel();

    channel.consume('seat.restoration', async (message) => {
        if (!message) return;

        try {
            const { bookingId, flightId, seats, seatClass } = JSON.parse(message.content.toString());
            console.log(`Restoring ${seats} seat(s) for flight ${flightId} (booking ${bookingId})${seatClass ? ` [${seatClass}]` : ''}`);

            await FlightService.updateSeats({ flightId, seats, dec: false, seatClass });

            // ack — tell RabbitMQ this message was processed successfully, remove from queue
            channel.ack(message);
        } catch (error) {
            console.error('Seat restoration failed, requeueing message:', error.message);
            // nack with requeue:true — put message back in queue for retry
            channel.nack(message, false, true);
        }
    });

    console.log('Seat restoration subscriber active');
}

module.exports = subscribeSeatRestoration;
