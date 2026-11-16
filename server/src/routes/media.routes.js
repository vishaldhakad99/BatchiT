const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/media.controller');
const upload = require('../middleware/upload.middleware');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/upload', upload.single('file'), mediaController.uploadFile);

module.exports = router;
