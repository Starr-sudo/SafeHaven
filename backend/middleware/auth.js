/**
 * Authentication Middleware
 * Validates anonymous user ID from frontend
 * Auto-creates user if doesn't exist (README approach)
 */

const supabase = require('../config/supabase');

module.exports = async function authMiddleware(req, res, next) {
  try {
    // Get anonymous ID from header (frontend generates this)
    const anonymousId = req.headers['x-anonymous-user-id'];
    
    if (!anonymousId) {
      return res.status(401).json({ 
        error: 'Missing user ID. Please refresh the page.' 
      });
    }
    
    // Validate format - frontend generates: user_<timestamp>_<random>
    if (!anonymousId.startsWith('user_')) {
      return res.status(401).json({ 
        error: 'Invalid user ID format.' 
      });
    }
    
    // Check if user exists in Supabase
    let { data: user, error } = await supabase
      .from('users')
      .select('id, anonymous_id')
      .eq('anonymous_id', anonymousId)
      .single();
    
    // If user doesn't exist, create them (auto-register)
    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          anonymous_id: anonymousId,
          last_active: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (createError) {
        console.error('Auto-create user error:', createError);
        return res.status(500).json({ 
          error: 'Failed to create user session' 
        });
      }
      
      user = newUser;
    }
    
    // Update last_active timestamp
    await supabase
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('anonymous_id', anonymousId);
    
    // Attach user info to request
    req.user = {
      id: user.id,
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