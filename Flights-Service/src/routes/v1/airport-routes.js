/**
 * Airport Routes — mounted at /api/v1/airports
 *
 * POST   /     → create a new airport (name, code, and cityId required)
 * GET    /     → fetch all airports
 * GET    /:id  → fetch a single airport by primary key
 * DELETE /:id  → delete an airport (cascades to its Flights)
 * PATCH  /:id  → update an airport's fields
 */
const express = require('express');
const router = express.Router();
const {AirportMiddlewares} = require('../../middlewares');
const {AirportController} = require('../../controllers');

// Validate that name, code, and cityId are present before creating
router.post('/', AirportMiddlewares.validateCreateRequest, AirportController.createAirport);

router.get('/', AirportController.getAirports);
router.get('/:id', AirportController.getAirport);

// Deleting an airport cascades and removes all flights departing from or arriving at it
router.delete('/:id', AirportController.destroyAirport);
router.patch('/:id', AirportController.updateAirport);


module.exports = router;


