/**
 * Rate Limiting Middleware
 * As shown in the README
 */

import rateLimit from 'express-rate-limit';

// Chat limiter: 30 messages per 15 minutes
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: 'Too many requests, please try again later.'
});

// Post limiter: 10 posts per hour
const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 posts per hour
  message: 'Too many posts, please try again later.'
});

// Comment limiter: 30 comments per hour (your addition)
const commentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 comments per hour
  message: 'Too many comments, please try again later.'
});

// General limiter: 100 requests per minute (your addition)
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later.'
});

export {
  chatLimiter,
  postLimiter,
  commentLimiter,
  generalLimiter
};