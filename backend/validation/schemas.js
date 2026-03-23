/**
 * Zod Validation Schemas
 * Defines rules for all user input
 */

import { z } from 'zod';

// Post schema
const postSchema = z.object({
  content: z.string()
    .min(1, 'Post content cannot be empty')
    .max(2000, 'Post content cannot exceed 2000 characters'),
  mood: z.enum(['Positive', 'Neutral', 'Negative'], {
    errorMap: () => ({ message: 'Mood must be Positive, Neutral, or Negative' })
  })
});

// Comment schema
const commentSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment cannot exceed 1000 characters')
});

// Chat schema
const chatSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message is too long'),
  conversation_history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string()
    })
  ).max(50).optional()
});

export {
  postSchema,
  commentSchema,
  chatSchema
};