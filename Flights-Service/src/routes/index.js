/**
 * Root API Router — mounted at /api in src/index.js
 * Splits traffic between API versions.
 *
 * /v1 → routes/v1/index.js  (active — all current endpoints live here)
 * /v2 → routes/v2/index.js  (placeholder — no routes registered yet)
 */
const express = require('express');

const v1Routes = require('./v1');
const v2Routes = require('./v2');
const router = express.Router();

router.use('/v1', v1Routes);
router.use('/v2', v2Routes);
module.exports = router;