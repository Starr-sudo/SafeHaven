/**
 * Input Validation Schemas using Zod
 * These define what valid data looks like
 */

const { z } = require('zod');

// Schema for creating a post
const postSchema = z.object({
  content: z.string()
    .min(1, 'Post content cannot be empty')
    .max(2000, 'Post content cannot exceed 2000 characters'),
  mood: z.enum(['Positive', 'Neutral', 'Negative'], {
    errorMap: () => ({ message: 'Mood must be Positive, Neutral, or Negative' })
  })
});

// Schema for creating a comment
const commentSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment cannot exceed 1000 characters')
});

// Schema for AI chat message
const chatSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message is too long (max 5000 characters)')
});

// Schema for conversation history (optional)
const conversationHistorySchema = z.array(
  z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })
).max(50, 'Too many conversation history items');

// Schema for full chat request
const fullChatSchema = z.object({
  message: chatSchema.shape.message,
  conversation_history: conversationHistorySchema.optional()
});

// Schema for anonymous user ID validation
const userIdSchema = z.object({
  anonymous_id: z.string()
    .min(10, 'Invalid user ID')
    .startsWith('user_', 'User ID must start with "user_"')
});

module.exports = {
  postSchema,
  commentSchema,
  chatSchema,
  conversationHistorySchema,
  fullChatSchema,
  userIdSchema
};
