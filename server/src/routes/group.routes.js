const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', groupController.createGroup);
router.get('/', groupController.getGroups);
router.get('/:groupId', groupController.getGroupDetails);
router.post('/:groupId/members', groupController.addMembers);
router.delete('/:groupId/members/:memberId', groupController.removeMember);

module.exports = router;
