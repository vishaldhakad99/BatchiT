const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', deviceController.getDevicesAndSessions);
router.delete('/:sessionId', deviceController.revokeSession);

module.exports = router;
