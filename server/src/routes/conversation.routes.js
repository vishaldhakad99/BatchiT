const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversation.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', conversationController.getConversations);
router.post('/direct', conversationController.getOrCreateConversation);
router.put('/:conversationId/pin', conversationController.togglePinConversation);
router.put('/:conversationId/archive', conversationController.toggleArchiveConversation);
router.put('/:conversationId/settings', conversationController.updateConversationSettings);

module.exports = router;
