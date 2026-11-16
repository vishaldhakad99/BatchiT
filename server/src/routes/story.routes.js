const express = require('express');
const router = express.Router();
const storyController = require('../controllers/story.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');
const { createStorySchema } = require('../validators/message.validator');

router.use(protect);

router.post('/', validate(createStorySchema), storyController.createStory);
router.get('/feed', storyController.getFeedStories);
router.post('/:storyId/view', storyController.viewStory);
router.get('/:storyId/viewers', storyController.getStoryViewers);
router.delete('/:storyId', storyController.deleteStory);

module.exports = router;
