const { z } = require('zod');

const sendMessageSchema = z.object({
  body: z.object({
    conversationId: z.string().optional(),
    recipientId: z.string().optional(),
    type: z.enum(['text', 'image', 'video', 'audio', 'snap', 'call']).default('text'),
    content: z.string().optional(),
    mediaUrl: z.string().optional(),
    mediaThumbnail: z.string().optional(),
    mediaSize: z.number().optional(),
    mediaMime: z.string().optional(),
    isEncrypted: z.boolean().default(false),
    iv: z.string().optional(),
    replyTo: z.string().optional()
  })
});

const sendSnapSchema = z.object({
  body: z.object({
    recipients: z.array(z.string()).min(1, 'Please select at least one recipient'),
    mediaUrl: z.string().min(1, 'Media URL is required'),
    mediaType: z.enum(['photo', 'video']).default('photo'),
    duration: z.number().min(1).max(60).default(5),
    viewOnce: z.boolean().default(true),
    textOverlay: z.string().optional(),
    filter: z.string().optional(),
    drawingData: z.string().optional()
  })
});

const createStorySchema = z.object({
  body: z.object({
    mediaUrl: z.string().min(1, 'Media is required'),
    mediaType: z.enum(['image', 'video']).default('image'),
    caption: z.string().max(300).optional(),
    audience: z.enum(['everyone', 'friends', 'close_friends']).default('friends'),
    duration: z.number().min(1).max(60).default(5)
  })
});

module.exports = {
  sendMessageSchema,
  sendSnapSchema,
  createStorySchema
};
