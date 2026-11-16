const express = require('express');
const router = express.Router();
const memoryController = require('../controllers/memory.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', memoryController.saveMemory);
router.get('/', memoryController.getMemories);
router.post('/vault', memoryController.getVaultMemories);
router.delete('/:memoryId', memoryController.deleteMemory);

module.exports = router;
