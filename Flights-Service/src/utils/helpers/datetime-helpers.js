/**
 * Compares two datetime strings and returns true if the first is strictly after the second.
 * Used in FlightService.createFlight to validate that departureTime comes before arrivalTime.
 * If this returns true, the flight data is invalid (departure is after arrival).
 *
 * @param {string} timeString1 - Parseable date/datetime string (e.g., departure time).
 * @param {string} timeString2 - Parseable date/datetime string (e.g., arrival time).
 * @returns {boolean} true if timeString1 > timeString2 (i.e., first time is later — invalid for flights).
 */
function compareTime(timeString1, timeString2){
    let dateTime1 = new Date(timeString1);
    let dateTime2 = new Date(timeString2);

    return dateTime1.getTime() > dateTime2.getTime();
}
module.exports = {
    compareTime
}