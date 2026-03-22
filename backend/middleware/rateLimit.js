/**
 * Rate Limiting Middleware - Simplified Version
 * Limits how many requests a user can make
 */

const rateLimit = require('express-rate-limit');

// Simple rate limiter that just works
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    // Don't use custom keyGenerator - let the library handle it
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Pre-configured limiters for different routes
const limiters = {
  // Posts: 10 posts per hour
  posts: createRateLimiter(
    60 * 60 * 1000,  // 1 hour
    10,
    'You have reached the limit of 10 posts per hour. Please try again later.'
  ),
  
  // Comments: 30 comments per hour
  comments: createRateLimiter(
    60 * 60 * 1000,  // 1 hour
    30,
    'You have reached the limit of 30 comments per hour. Please try again later.'
  ),
  
  // Chat: 30 messages per 15 minutes
  chat: createRateLimiter(
    15 * 60 * 1000,  // 15 minutes
    30,
    'Too many messages. Please wait a moment before sending more.'
  ),
  
  // Session creation: 5 sessions per hour
  session: createRateLimiter(
    60 * 60 * 1000,  // 1 hour
    5,
    'Too many session creations. Please try again later.'
  ),
  
  // General: 100 requests per minute
  general: createRateLimiter(
    60 * 1000,  // 1 minute
    100,
    'Too many requests. Please slow down.'
  )
};

module.exports = limiters;