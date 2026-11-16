const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');
const { updateProfileSchema, vaultPinSchema } = require('../validators/user.validator');

router.use(protect);

router.get('/search', userController.searchUsers);
router.get('/profile/:username', userController.getUserProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.post('/vault/pin', validate(vaultPinSchema), userController.setVaultPin);
router.post('/vault/verify', validate(vaultPinSchema), userController.verifyVaultPin);
router.post('/block/:targetUserId', userController.blockUser);
router.post('/unblock/:targetUserId', userController.unblockUser);
router.get('/blocked', userController.getBlockedUsers);

module.exports = router;
