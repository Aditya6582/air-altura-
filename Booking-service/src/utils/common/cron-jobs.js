/*
 * Cron Jobs
 *
 * Defines and schedules all background tasks for the booking service.
 * Exported as a single scheduleCrons() function that is called once in src/index.js
 * after the server has started.
 *
 * Why imported directly in src/index.js and NOT via utils/common/index.js:
 *  - cron-jobs.js requires booking-service, and booking-service requires utils/common.
 *    If cron-jobs were exported through utils/common/index.js, it would create a circular
 *    dependency: booking-service → utils/common → cron-jobs → booking-service.
 *    Node.js would return an empty {} for booking-service at require time, making
 *    BookingService.cancelOldBookings undefined. Importing directly in index.js breaks the cycle.
 *
 * Current jobs:
 *   - Every 2 minutes: cancel all abandoned/pending bookings older than 5 minutes
 */

const cron = require('node-cron');

const {BookingService} = require('../../services/');

function scheduleCrons(){

    /*
     * Abandoned Booking Cleanup — runs every 5 minutes
     *
     * Purpose: act as a "janitor" that releases seats locked by bookings
     * where the user never came back to complete payment.
     *
     * Without this, ghost INITIATED bookings would permanently hold seats,
     * causing available seat counts to drain over time.
     *
     * The 5-minute interval vs 10-minute expiry window means:
     *   worst case: a booking can sit as INITIATED for up to 15 minutes before cleanup.
     *   makePayment independently enforces the hard 10-minute cutoff at payment time,
     *   so no user ever actually gets more than 10 minutes regardless of cron timing.
     */
    cron.schedule('*/5 * * * *', async () => {
        const response = await BookingService.cancelOldBookings();
        console.log(response); // logs [ affectedRows ] — 0 if no abandoned bookings this tick
    });
}

module.exports = scheduleCrons;
