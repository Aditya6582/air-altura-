/**
 * Airplane Routes — mounted at /api/v1/airplanes
 *
 * POST   /     → create a new airplane (modelNumber required)
 * GET    /     → fetch all airplanes
 * GET    /:id  → fetch a single airplane by primary key
 * DELETE /:id  → delete an airplane (cascades to its Flights and Seats)
 * PATCH  /:id  → update an airplane's fields
 */
const express = require('express');
const router = express.Router();
const {AirplaneMiddlewares} = require('../../middlewares');
const {AirplaneController} = require('../../controllers');

// Validate that modelNumber is present before creating
router.post('/', AirplaneMiddlewares.validateCreateRequest, AirplaneController.createAirplane);

router.get('/', AirplaneController.getAirplanes);
router.get('/:id', AirplaneController.getAirplane);

// Deleting an airplane cascades and removes all linked flights and seats
router.delete('/:id', AirplaneController.destroyAirplane);
router.patch('/:id', AirplaneController.updateAirplane);


module.exports = router;


