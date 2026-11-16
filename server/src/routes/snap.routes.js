const express = require('express');
const router = express.Router();
const snapController = require('../controllers/snap.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');
const { sendSnapSchema } = require('../validators/message.validator');

router.use(protect);

router.post('/', validate(sendSnapSchema), snapController.sendSnap);
router.get('/inbox', snapController.getReceivedSnaps);
router.get('/sent', snapController.getSentSnaps);
router.post('/:snapId/open', snapController.openSnap);
router.post('/:snapId/screenshot', snapController.reportScreenshot);

module.exports = router;
