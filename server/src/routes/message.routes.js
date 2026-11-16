const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');
const { sendMessageSchema } = require('../validators/message.validator');

router.use(protect);

router.get('/conversation/:conversationId', messageController.getMessages);
router.post('/', validate(sendMessageSchema), messageController.sendMessage);
router.post('/:messageId/reaction', messageController.reactToMessage);
router.put('/:messageId', messageController.editMessage);
router.delete('/:messageId', messageController.deleteMessage);
router.post('/conversation/:conversationId/read', messageController.markAsRead);

module.exports = router;
