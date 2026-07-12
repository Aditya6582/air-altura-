/*
 * Root API router.
 *
 * Splits traffic by API version so that future breaking changes
 * can be shipped under /v2 without affecting existing /v1 consumers.
 *
 * Current routing:
 *   /api/v1  →  v1Routes  (active)
 *   /api/v2  →  v2Routes  (placeholder for future version)
 */

const express = require('express');

const v1Routes = require('./v1');
const v2Routes = require('./v2');
const router = express.Router();

router.use('/v1',v1Routes);
router.use('/v2',v2Routes);
module.exports = router;