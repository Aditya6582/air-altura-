const { Router } = require('express');
const v1Router = require('./v1');

const router = Router();

router.use('/v1', v1Router);

module.exports = router;
