const { Resend } = require('resend');
const { getChannel } = require('../config/rabbitmq-config');
const { ServerConfig } = require('../config');

const resend = new Resend(ServerConfig.RESEND_API_KEY);

/*
 * subscribeBookingConfirmed
 *
 * Consumes messages from the 'booking.confirmed' queue published by the Booking Service
 * after a successful payment. For each message:
 *
 *  1. Parse the event payload { bookingId, userId, email, flightId, totalCost }
 *  2. Send a booking confirmation email via Resend — email comes from the payload
 *     (forwarded by the API Gateway from the JWT so no DB lookup needed)
 *  3. ack the message on success so RabbitMQ removes it from the queue
 *  4. nack (requeue: false) on failure — logs the error, discards the message
 *     to avoid infinite retry loops on bad payloads.
 *
 * prefetch(1): process one message at a time so a slow email send
 * doesn't cause unbounded memory growth from queued messages.
 */
async function subscribeBookingConfirmed() {
    const channel = getChannel();

    // Process one message at a time
    channel.prefetch(1);

    channel.consume('booking.confirmed', async (msg) => {
        if (!msg) return;

        let payload;
        try {
            payload = JSON.parse(msg.content.toString());
        } catch (err) {
            console.error('Failed to parse booking.confirmed message:', err.message);
            channel.nack(msg, false, false);
            return;
        }

        const { bookingId, userId, email, flightId, totalCost } = payload;

        if (!email) {
            console.error(`booking.confirmed for booking ${bookingId} has no email — discarding`);
            channel.nack(msg, false, false);
            return;
        }

        try {
            // Send confirmation email via Resend
            const result = await resend.emails.send({
                from: ServerConfig.FROM_EMAIL,
                to: email,
                subject: 'Your booking is confirmed!',
                html: `
                    <h2>Booking Confirmed</h2>
                    <p>Hi, your flight booking has been confirmed.</p>
                    <ul>
                        <li><strong>Booking ID:</strong> ${bookingId}</li>
                        <li><strong>Flight ID:</strong> ${flightId}</li>
                        <li><strong>Amount Paid:</strong> ₹${totalCost}</li>
                    </ul>
                    <p>Have a great flight!</p>
                `,
            });

            if (result?.error) {
                throw new Error(result.error.message || 'Unknown Resend error');
            }

            console.log(`Confirmation email sent to ${email} for booking ${bookingId}`);
            channel.ack(msg);
        } catch (err) {
            // nack without requeue — avoid infinite loops on persistent failures
            // (e.g. Resend API down, invalid email). The message is discarded.
            console.error(`Failed to send confirmation for booking ${bookingId}:`, err.message);
            channel.nack(msg, false, false);
        }
    });

    console.log('Subscribed to booking.confirmed queue');
}

module.exports = { subscribeBookingConfirmed };
