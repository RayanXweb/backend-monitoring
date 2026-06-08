const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  verifyPinController, 
  registerPinController,
  changePinController 
} = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Verify PIN
router.post('/verify-pin', [
  body('pin').isLength({ min: 6, max: 6 }).withMessage('PIN must be 6 digits'),
], verifyPinController);

// Register new PIN (for client app)
router.post('/register-pin', [
  body('pin').isLength({ min: 6, max: 6 }).withMessage('PIN must be 6 digits'),
  body('email').isEmail().withMessage('Valid email required'),
  body('name').optional(),
], registerPinController);

// Change PIN (protected)
router.put('/change-pin', [
  authenticate,
  body('oldPin').isLength({ min: 6, max: 6 }),
  body('newPin').isLength({ min: 6, max: 6 }),
], changePinController);

module.exports = router;
