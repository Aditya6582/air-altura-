/*
 * Booking Service
 *
 * Contains all the core business logic for the booking microservice.
 * This service is heavier than the flight service because it orchestrates
 * multiple operations across two services (booking DB + flight service HTTP calls)
 * and manages database transactions manually to ensure data consistency.
 *
 * All functions use UNMANAGED transactions:
 *   - transaction is started manually with db.sequelize.transaction()
 *   - must explicitly call transaction.commit() on success
 *   - must explicitly call transaction.rollback() in catch block
 *   - any query that must be part of the transaction must receive { transaction } in options
 */

const axios = require('axios')

const {BookingRepository} = require('../repositories');

const { ServerConfig, RabbitMQ } = require('../config')
const db = require('../models');
const AppError = require('../utils/errors/app-error');
const { StatusCodes } = require('http-status-codes');

// single shared instance of the repository used across all service functions
const bookingRepository = new BookingRepository()
const { ENUMS } = require('../utils/common')
const {BOOKED,CANCELLED} = ENUMS.BOOKING_STATUS;


/*
 * createBooking
 *
 * Receives: { flightId, noofSeats, userId }
 *
 * Steps:
 *  1. Fetch flight details from the Flight Service via HTTP GET
 *  2. Check if requested seats <= available seats on the flight — throw 400 if not
 *  3. Calculate total billing amount = noofSeats * flight.price
 *  4. Create a booking record in the DB with status INITIATED (inside transaction)
 *  5. Call Flight Service PATCH to decrement available seats on the flight
 *  6. Commit the transaction
 *
 * Why transaction here:
 *  - The booking record and seat deduction must succeed or fail together.
 *    If the PATCH to flight service fails, the booking is rolled back so
 *    no ghost bookings exist with undeducted seats.
 *
 * Returns: true on success
 * Throws:  AppError 400 if not enough seats, or propagates any other error
 */
async function createBooking(data){

    const transaction = await db.sequelize.transaction();
    try{
        // Step 1: fetch flight details from Flight Service (includes FlightClasses since getFlight eager-loads them)
        // flight.data.data because Flight Service wraps response as { success, message, data: { flightObj } }
        const flight = await axios.get(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`);
        const flightData = flight.data.data;

        // Step 2: locate the requested cabin class and validate seat availability
        const seatClass = data.seatClass || 'economy';
        const flightClasses = flightData.FlightClasses || [];
        const flightClass = flightClasses.find(fc => fc.seatClass === seatClass);

        if(!flightClass){
            throw new AppError(`Seat class '${seatClass}' is not available on this flight`, StatusCodes.BAD_REQUEST);
        }
        if(data.noofSeats > flightClass.totalSeats){
            throw new AppError('Not enough seats available', StatusCodes.BAD_REQUEST);
        }

        // Step 3: calculate cost using cabin-class price
        const totalBillingAmount = data.noofSeats * flightClass.price;
        const bookingPayload = {
            ...data,
            totalCost: totalBillingAmount,
            noOfSeats: data.noofSeats,  // map request field name to model field name
            seatClass
        };

        // Step 4: create booking in INITIATED state — user has 10 mins to complete payment
        const booking = await bookingRepository.createBooking(bookingPayload, transaction);

        // Step 5: reserve seats on the flight service for the specific cabin class
        await axios.patch(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}/seats`, {
            seats: data.noofSeats,
            seatClass
        });

        // Step 6: everything succeeded, make it permanent
        await transaction.commit();
        return booking;
    }catch(error){
        await transaction.rollback();
        throw error;
    }
}


/*
 * makePayment
 *
 * Mimics a payment gateway. In a real system this would be a separate Payments microservice.
 *
 * Receives: { bookingId, userId, totalCost }
 *
 * Steps:
 *  1. Fetch the booking record from DB
 *  2. Check if already CANCELLED — throw 400 (cron may have already cleaned it up)
 *  3. Check if booking is older than 5 minutes — if so, cancel it via cancelBooking()
 *     and throw 400. This is the hard enforcement of the payment window.
 *     (cancelBooking uses its own transaction so the cancellation commits independently
 *      before this function's transaction rolls back)
 *  4. Validate that the totalCost sent by the client matches the stored totalCost
 *  5. Validate that the userId matches the booking's userId
 *  6. Mark the booking as BOOKED and commit
 *
 * Two-layer expiry protection:
 *  - Cron job (janitor):  bulk-cancels abandoned bookings every 5 minutes passively
 *  - makePayment (bouncer): hard-enforces 10-min limit at the moment of payment
 *    in case cron hasn't fired yet (worst case cron lag: ~5 min)
 *
 * Returns: nothing meaningful (Sequelize update response)
 * Throws:  AppError 400 for expired/mismatched booking, propagates other errors
 */
async function makePayment(data){
    const transaction = await db.sequelize.transaction();
    try {
        // Step 1: fetch booking
        const bookingDetails = await bookingRepository.get(data.bookingId);

        // Step 2: already cancelled — cron may have beaten us to it
        if(bookingDetails.status == CANCELLED){
            throw new AppError('The booking has expired',StatusCodes.BAD_REQUEST);
        }

        // Step 3: check 10-minute payment window
        const bookingTime = new Date(bookingDetails.createdAt);
        const currentTime = new Date();
        if(currentTime - bookingTime > 600000){
            // cancelBooking has its own transaction — commits seat restoration independently
            await cancelBooking(data.bookingId);
            throw new AppError('The booking has expired',StatusCodes.BAD_REQUEST);
        }

        // Step 4: cost validation — prevents tampered/incorrect payment amounts
        if(bookingDetails.totalCost != data.totalCost){
            throw new AppError('The amount of the payment doesnt match',StatusCodes.BAD_REQUEST);
        }

        // Step 5: user validation — ensures only the original booker can complete payment
        if(bookingDetails.userId!=data.userId){
            throw new AppError('The user corresponding to the booking doesnt match',StatusCodes.BAD_REQUEST );
        }

        // Step 6: payment assumed successful — mark as BOOKED
        const response = await bookingRepository.update({status:BOOKED},data.bookingId,transaction);
        await transaction.commit();

        // Step 7: publish booking.confirmed event — Reminder Service will send confirmation email
        // Wrapped in its own try-catch: a failed publish must NOT affect the payment response.
        // The booking is already committed to DB — that is the source of truth.
        try {
            const channel = RabbitMQ.getChannel();
            channel.sendToQueue(
                'booking.confirmed',
                Buffer.from(JSON.stringify({
                    bookingId: data.bookingId,
                    userId:    data.userId,
                    email:     data.email,
                    flightId:  bookingDetails.flightId,
                    totalCost: data.totalCost
                })),
                { persistent: true }
            );
        } catch (publishError) {
            console.error('Failed to publish booking.confirmed event:', publishError.message);
        }

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

/*
 * cancelBooking
 *
 * Cancels a specific booking by ID and publishes a seat restoration event.
 * Called internally by makePayment when the payment window has expired.
 *
 * Receives: bookingId (number)
 *
 * Steps:
 *  1. Fetch the booking (bound to transaction for consistency)
 *  2. If already CANCELLED — commit and return early (idempotent)
 *  3. Update booking status to CANCELLED in DB
 *  4. Commit transaction
 *  5. Publish seat.restoration event to RabbitMQ — Flight Service restores seats asynchronously
 *
 * Why RabbitMQ instead of direct HTTP (previous approach):
 *  - Consistent with cancelOldBookings (cron) — all cancellations use the same pattern
 *  - If Flight Service is down, the event waits durably in the queue until it recovers
 *  - Direct HTTP would silently drop the seat restoration if Flight Service was unavailable
 *
 * Why publish AFTER commit (not inside transaction):
 *  - Same pattern as booking.confirmed in makePayment
 *  - The DB is the source of truth — booking is CANCELLED regardless of publish success
 *  - A failed publish is logged but does not affect the cancellation response
 *
 * Returns: true if already cancelled, otherwise void
 * Throws:  propagates any DB error up to the caller
 */
async function cancelBooking(bookingId){
    const transaction = await db.sequelize.transaction();
    try {
        const bookingDetails = await bookingRepository.get(bookingId, transaction);

        // idempotent — if already cancelled, nothing to do
        if(bookingDetails.status == CANCELLED){
            await transaction.commit();
            return true;
        }

        await bookingRepository.update({status: CANCELLED}, bookingId, transaction);
        await transaction.commit();

        // Publish seat restoration event AFTER commit — booking is already cancelled in DB.
        // Flight Service subscriber increments totalSeats back asynchronously.
        // Wrapped in try-catch: a failed publish does not affect the cancellation.
        try {
            const channel = RabbitMQ.getChannel();
            channel.sendToQueue(
                'seat.restoration',
                Buffer.from(JSON.stringify({
                    bookingId: bookingId,
                    flightId:  bookingDetails.flightId,
                    seats:     bookingDetails.noOfSeats,
                    seatClass: bookingDetails.seatClass   // route restoration to correct cabin class
                })),
                { persistent: true }
            );
        } catch (publishError) {
            console.error('Failed to publish seat.restoration event:', publishError.message);
        }

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

/*
 * cancelOldBookings
 *
 * Called by the cron job every 5 minutes.
 * Computes the cutoff timestamp (10 minutes ago) and delegates to the repository
 * for a bulk UPDATE — no looping, single DB query regardless of how many rows match.
 *
 * Receives: nothing (timestamp parameter is unused — computed internally)
 *
 * Returns: Sequelize update response [ affectedRows ]
 *          affectedRows = 0 means no abandoned bookings found this tick
 */
async function cancelOldBookings(){
    try {
        const time = new Date(Date.now() - 1000 * 600);

        // Step 1: fetch expired bookings BEFORE cancelling — we need the data for RabbitMQ
        const expiredBookings = await bookingRepository.getOldBookings(time);
        if (!expiredBookings.length) return [];

        // Step 2: cancel exactly these bookings by their IDs (atomic, no race condition)
        const ids = expiredBookings.map(b => b.id);
        const response = await bookingRepository.cancelBookingsByIds(ids);

        // Step 3: publish one seat.restoration event per cancelled booking
        // Flight Service subscribes and restores seats asynchronously
        // If Flight Service is down, events wait durably in the queue until it recovers
        const channel = RabbitMQ.getChannel();
        expiredBookings.forEach(booking => {
            channel.sendToQueue(
                'seat.restoration',
                Buffer.from(JSON.stringify({
                    bookingId: booking.id,
                    flightId:  booking.flightId,
                    seats:     booking.noOfSeats,
                    seatClass: booking.seatClass   // route restoration to correct cabin class
                })),
                { persistent: true } // message survives RabbitMQ restart
            );
        });

        console.log(`Cancelled ${ids.length} expired bookings, published ${ids.length} seat restoration events`);
        return response;
    } catch (error) {
        console.error('cancelOldBookings cron error:', error.message);
    }
}




/*
 * cancelUserBooking
 *
 * User-initiated cancellation. Verifies ownership before delegating to cancelBooking.
 *
 * Receives: { bookingId, userId }
 *
 * Steps:
 *  1. Fetch the booking
 *  2. Verify the booking belongs to the requesting user — throw 403 if not
 *  3. Delegate to cancelBooking — handles idempotency, DB update, and seat restoration event
 *
 * Why not just expose cancelBooking directly?
 *  - cancelBooking has no user context — it's an internal function called by makePayment and cron
 *  - Adding ownership check here keeps cancelBooking pure (no auth concern)
 *
 * Returns: void
 * Throws:  AppError 404 if booking not found, AppError 403 if userId mismatch
 */
async function cancelUserBooking(data) {
    const booking = await bookingRepository.get(data.bookingId);

    if (String(booking.userId) !== String(data.userId)) {
        throw new AppError('You are not authorised to cancel this booking', StatusCodes.FORBIDDEN);
    }

    await cancelBooking(data.bookingId);
}


/*
 * getBookingsByUser
 *
 * Returns all bookings for a given user, newest first.
 * No pagination — acceptable for this project scope.
 *
 * Receives: userId (number | string)
 * Returns:  array of Booking instances
 */
async function getBookingsByUser(userId) {
    return await bookingRepository.getBookingsByUserId(userId);
}


module.exports = {
createBooking,
makePayment,
cancelBooking,
cancelOldBookings,
cancelUserBooking,
getBookingsByUser
}
