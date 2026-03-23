/**
 * Authentication Middleware 
 * Uses anonymous ID from frontend
 * No database dependency (keeps app fully anonymous)
 */

export default function authMiddleware(req, res, next) {
  try {
    // Get anonymous ID from header
    const anonymousId = req.headers['x-anonymous-user-id'];

    if (!anonymousId) {
      return res.status(401).json({
        error: 'Missing user ID. Please refresh the page.'
      });
    }

    // Basic format check 
    if (!anonymousId.startsWith('user_')) {
      return res.status(401).json({
        error: 'Invalid user ID format.'
      });
    }

    // Attach user info to request (no DB lookup)
    req.user = {
      anonymous_id: anonymousId
    };

    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Authentication failed. Please try again.'
    });
  }
};