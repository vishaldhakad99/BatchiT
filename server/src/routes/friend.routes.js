const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friend.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/request', friendController.sendFriendRequest);
router.post('/request/:requestId/accept', friendController.acceptFriendRequest);
router.post('/request/:requestId/reject', friendController.rejectFriendRequest);
router.delete('/request/:requestId/cancel', friendController.cancelFriendRequest);
router.get('/list', friendController.getFriends);
router.get('/requests', friendController.getPendingRequests);
router.get('/suggestions', friendController.getFriendSuggestions);
router.delete('/:friendId', friendController.removeFriend);

module.exports = router;
