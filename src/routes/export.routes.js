const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { exportData } = require('../controllers/export.controller');

router.use(authenticate);
router.get('/:type/:format', exportData);

module.exports = router;
