const { z } = require('zod');

const updateProfileSchema = z.object({
  body: z.object({
    displayName: z.string().min(1).max(50).optional(),
    bio: z.string().max(200).optional(),
    avatar: z.string().optional(),
    publicKey: z.string().optional(),
    isPrivateAccount: z.boolean().optional(),
    onlineStatusVisible: z.boolean().optional(),
    lastSeenVisible: z.boolean().optional(),
    messagePrivacy: z.enum(['everyone', 'friends', 'nobody']).optional(),
    storyPrivacy: z.enum(['everyone', 'friends', 'close_friends']).optional(),
    themePreference: z.enum(['dark', 'light', 'system']).optional(),
    accentColor: z.string().optional()
  })
});

const vaultPinSchema = z.object({
  body: z.object({
    pin: z
      .string()
      .length(4, 'PIN must be exactly 4 digits')
      .regex(/^[0-9]{4}$/, 'PIN must contain only numbers')
  })
});

module.exports = {
  updateProfileSchema,
  vaultPinSchema
};
