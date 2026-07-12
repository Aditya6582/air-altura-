// Notifications Service has no database — it is a pure RabbitMQ consumer.
// User emails are delivered via the booking.confirmed event payload.
module.exports = {};
