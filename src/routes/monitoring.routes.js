const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const monitoringController = require('../controllers/monitoring.controller');

// Apply authentication to all routes
router.use(authenticate);

// Dashboard
router.get('/dashboard/stats', monitoringController.getDashboardStats);

// Emails
router.get('/emails', monitoringController.getEmails);
router.post('/emails', monitoringController.createEmail);

// WhatsApp
router.get('/whatsapp', monitoringController.getWhatsApp);
router.post('/whatsapp', monitoringController.createWhatsApp);

// Social Media
router.get('/social-media', monitoringController.getSocialMedia);

// Contacts
router.get('/contacts', monitoringController.getContacts);
router.post('/contacts', monitoringController.createContact);
router.put('/contacts/:id', monitoringController.updateContact);
router.delete('/contacts/:id', monitoringController.deleteContact);

// SMS
router.get('/sms', monitoringController.getSMS);
router.post('/sms', monitoringController.createSMS);

// Calls
router.get('/calls', monitoringController.getCalls);
router.post('/calls', monitoringController.createCall);

// Location
router.get('/location', monitoringController.getLocation);
router.post('/location', monitoringController.updateLocation);

// Network
router.get('/network', monitoringController.getNetwork);
router.post('/network', monitoringController.updateNetwork);

// Device
router.get('/device', monitoringController.getDevice);
router.post('/device', monitoringController.updateDevice);

module.exports = router;
