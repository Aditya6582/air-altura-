/**
 * City Routes — mounted at /api/v1/cities
 *
 * POST   /     → create a new city (name required, must be unique)
 * DELETE /:id  → delete a city by primary key
 * PATCH  /:id  → update a city's name
 *
 * Note: No GET routes — cities are returned as nested objects inside Airport responses.
 */
const express = require('express');
const router = express.Router();

const {CityController} = require('../../controllers');
const {CityMiddlewares} = require('../../middlewares')

// Validate that name is present before creating
router.post('/', CityMiddlewares.validateCreateRequest, CityController.createCity);
router.delete('/:id', CityController.destroyCity);
router.patch('/:id', CityController.updateCity);
module.exports = router;
