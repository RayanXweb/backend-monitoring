const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const profileController = require('../controllers/profile.controller');

router.use(authenticate);

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.get('/notifications', profileController.getNotificationSettings);
router.put('/notifications', profileController.updateNotificationSettings);

module.exports = router;
