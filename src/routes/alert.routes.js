const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const alertController = require('../controllers/alert.controller');

router.use(authenticate);

router.get('/', alertController.getAlerts);
router.put('/:id/read', alertController.markAsRead);
router.put('/read-all', alertController.markAllAsRead);
router.delete('/:id', alertController.deleteAlert);

module.exports = router;
