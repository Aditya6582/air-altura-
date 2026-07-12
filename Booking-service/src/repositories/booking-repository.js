/*
 * BookingRepository
 *
 * Extends CrudRepository with Booking-specific data access methods.
 * Overrides get, update, and create from the base class to add transaction support,
 * since the booking flow requires multiple queries to be atomic.
 *
 * Also adds cancelOldBookings — a bulk update query used by the cron job,
 * which cannot be expressed through the generic CrudRepository interface.
 */

const {StatusCodes} = require('http-status-codes')
const AppError = require('../utils/errors/app-error');
const {Booking} = require('../models');
const CrudRepository = require('./crud-repository');
const {Op} = require('sequelize');
const { ENUMS } = require('../utils/common')
const {BOOKED,CANCELLED,INITIATED} = ENUMS.BOOKING_STATUS;


class BookingRepository extends CrudRepository{
    constructor(){
        super(Booking);
    }

    /*
     * createBooking (override of base create)
     * Creates a new booking row inside a transaction.
     * The base class create() has no transaction support, so we override it here.
     *
     * Receives: data (booking fields), transaction (Sequelize transaction object)
     * Returns:  newly created Booking instance
     */
    async createBooking(data,transaction){
        const response =  await Booking.create(data,{transaction:transaction});
        return response;
    }

    /*
     * get (override)
     * Fetches a booking by primary key, optionally bound to a transaction.
     * Overrides base class to accept a transaction parameter — needed when the
     * read must be part of a larger atomic operation (e.g. during payment or cancellation).
     *
     * Receives: id (number), transaction (optional)
     * Returns:  Booking instance
     * Throws:   AppError 404 if not found
     */
    async get(data,transaction){
            const response = await this.model.findByPk(data,{transaction:transaction});
            if(!response){
                throw new AppError('Not able to find a resource',StatusCodes.NOT_FOUND);
            }
            return response;
    }

    /*
     * update (override)
     * Updates a booking row by id, bound to a transaction.
     * Overrides base class to accept a transaction parameter — ensures the update
     * is part of the same atomic operation as the surrounding queries.
     *
     * Receives: data (fields to update), id (number), transaction (Sequelize transaction)
     * Returns:  [ affectedRows ]
     * Throws:   AppError 404 if no row was updated
     */
    async update(data, id, transaction) {
        const response = await this.model.update(data, {
            where: { id: id },
            transaction: transaction
        });
        if(response[0] == 0) {
            throw new AppError('Resource to be updated not found', StatusCodes.NOT_FOUND);
        }
        return response;
    }

    /*
     * cancelOldBookings
     * Bulk UPDATE — cancels all bookings that are:
     *   - older than the provided timestamp (createdAt < timestamp, i.e. older than 5 mins ago)
     *   - NOT already BOOKED (don't touch completed bookings)
     *   - NOT already CANCELLED (avoid redundant updates)
     *
     * This effectively targets INITIATED and PENDING bookings that were abandoned.
     * Called by the cron job every 2 minutes via BookingService.cancelOldBookings().
     *
     * Single bulk query — no row-by-row looping, efficient regardless of row count.
     *
     * Receives: timestamp (Date) — the cutoff time (now - 5 minutes)
     * Returns:  [ affectedRows ] — 0 means no abandoned bookings found this tick
     */
    /*
     * getOldBookings
     * Fetches all INITIATED/PENDING bookings older than the given timestamp.
     * Called by the cron job BEFORE cancelling, so we have the data needed
     * to publish seat restoration events to RabbitMQ.
     *
     * Receives: timestamp (Date) — cutoff time (now - 5 minutes)
     * Returns:  array of Booking instances (may be empty)
     */
    async getOldBookings(timestamp) {
        return await Booking.findAll({
            where: {
                createdAt: { [Op.lt]: timestamp },
                status: { [Op.notIn]: [BOOKED, CANCELLED] }
            }
        });
    }

    /*
     * cancelBookingsByIds
     * Bulk UPDATE — cancels exactly the bookings identified by the given IDs.
     * Called after getOldBookings so we cancel precisely what we selected,
     * avoiding race conditions from using the time filter twice.
     *
     * Receives: ids (number[]) — array of booking primary keys
     * Returns:  [ affectedRows ]
     */
    async cancelBookingsByIds(ids) {
        return await Booking.update(
            { status: CANCELLED },
            {
                where: {
                    id: { [Op.in]: ids },
                    status: { [Op.notIn]: [BOOKED, CANCELLED] } // safety: don't touch paid bookings
                }
            }
        );
    }

    /*
     * getBookingsByUserId
     * Fetches all bookings for a given user, ordered newest first.
     * Used by the GET /my-bookings endpoint.
     *
     * Receives: userId (number)
     * Returns:  array of Booking instances (may be empty)
     */
    async getBookingsByUserId(userId) {
        return await Booking.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });
    }

    async cancelOldBookings(timestamp){
        const response = await Booking.update(
            { status: CANCELLED },
            {
                where: {
                    [Op.and]:[
                        {
                            createdAt: { [Op.lt]: timestamp }  // older than cutoff
                        },
                        {
                            status: {[Op.ne]:BOOKED}           // not already paid
                        },
                        {
                            status:{[Op.ne]:CANCELLED}         // not already cancelled
                        }
                    ]
                }
            }
        );
        return response;
    }
}




module.exports = BookingRepository;
