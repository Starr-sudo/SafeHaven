/**
 * Authentication Middleware with Supabase Verification
 * Validates that the anonymous user ID exists in the database
 */

const { supabaseAdmin } = require('../config/supabase');

module.exports = async function authMiddleware(req, res, next) {
  try {
    // Get the anonymous ID from request headers
    const anonymousId = req.headers['x-anonymous-user-id'];
    
    // Check if ID exists
    if (!anonymousId) {
      return res.status(401).json({
        error: 'Missing user ID. Please refresh the page.',
        code: 'MISSING_USER_ID'
      });
    }
    
    // Validate the format - frontend generates IDs like: user_1234567890_abc123def
    if (!anonymousId.startsWith('user_')) {
      return res.status(401).json({
        error: 'Invalid user ID format. Please refresh the page.',
        code: 'INVALID_FORMAT'
      });
    }
    
    // Check if ID is too short
    if (anonymousId.length < 20) {
      return res.status(401).json({
        error: 'Invalid user ID. Please refresh the page.',
        code: 'INVALID_LENGTH'
      });
    }
    
    // Verify the user exists in Supabase
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, last_active')
      .eq('anonymous_id', anonymousId)
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      // PGRST116 = not found, other errors are real issues
      console.error('Supabase user lookup error:', userError);
      return res.status(500).json({
        error: 'Authentication service unavailable. Please try again later.',
        code: 'SERVICE_ERROR'
      });
    }
    
    if (!existingUser) {
      // User doesn't exist - they need to create a session first
      return res.status(401).json({
        error: 'Session expired or not found. Please refresh the page.',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Update last_active timestamp (async, don't wait for response)
    supabaseAdmin
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('anonymous_id', anonymousId)
      .then(() => {})
      .catch(err => console.error('Failed to update last_active:', err));
    
    // Store user info on the request object
    req.anonymousId = anonymousId;
    req.userId = existingUser.id;
    
    // All good, proceed
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication failed. Please try again.',
      code: 'AUTH_FAILED'
    });
  }
};