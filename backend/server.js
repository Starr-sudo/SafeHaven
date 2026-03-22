/**
 * SafeHaven Authentication & Security Backend
 * Complete server with all endpoints and middleware
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import custom modules
const authMiddleware = require('./middleware/auth');
const validate = require('./middleware/validate');
const limiters = require('./middleware/rateLimit');
const { 
  postSchema, 
  commentSchema, 
  chatSchema,
  fullChatSchema 
} = require('./validation/schemas');
const { 
  moderateContent, 
  detectCrisis, 
  getCrisisResponse,
  moderate 
} = require('./utils/moderation');
const { supabaseAdmin } = require('./config/supabase');

const app = express();

// ========== MIDDLEWARE ==========

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Logging middleware for development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ========== HEALTH CHECK ==========

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'SafeHaven Auth Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      session: 'POST /api/session',
      posts: 'GET /api/posts, POST /api/posts',
      support: 'POST /api/posts/:id/support',
      comments: 'GET /api/posts/:id/comments, POST /api/posts/:id/comments',
      chat: 'POST /api/chat'
    }
  });
});

// ========== SESSION ENDPOINTS ==========

/**
 * POST /api/session
 * Create a new anonymous session
 * This is the first call when a user visits the site
 */
app.post('/api/session', limiters.session, async (req, res) => {
  try {
    // Generate a unique anonymous ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const anonymousId = `user_${timestamp}_${random}`;
    
    // Create user in Supabase
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([{
        anonymous_id: anonymousId,
        last_active: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (insertError) {
      console.error('Create user error:', insertError);
      return res.status(500).json({ 
        error: 'Failed to create session',
        code: 'DB_ERROR'
      });
    }
    
    // Return the anonymous ID to the frontend
    res.status(201).json({
      success: true,
      user_id: newUser.id,
      anonymous_id: anonymousId,
      created_at: newUser.created_at
    });
    
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create session',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * GET /api/session/validate
 * Validate an existing session
 */
app.get('/api/session/validate', authMiddleware, async (req, res) => {
  res.json({
    valid: true,
    user_id: req.userId,
    anonymous_id: req.anonymousId
  });
});

// ========== POSTS ENDPOINTS ==========

/**
 * GET /api/posts
 * Get all posts with pagination and filtering
 */
app.get('/api/posts', authMiddleware, async (req, res) => {
  try {
    const { limit = 20, offset = 0, mood } = req.query;
    
    // Validate limit and offset
    const parsedLimit = Math.min(parseInt(limit) || 20, 100);
    const parsedOffset = parseInt(offset) || 0;
    
    // Build query
    let query = supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(parsedOffset, parsedOffset + parsedLimit - 1);
    
    // Filter by mood if provided
    if (mood && ['Positive', 'Neutral', 'Negative'].includes(mood)) {
      query = query.eq('mood', mood);
    }
    
    const { data: posts, error, count } = await query;
    
    if (error) {
      console.error('Get posts error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch posts',
        code: 'DB_ERROR'
      });
    }
    
    res.json({
      success: true,
      posts: posts,
      total: count,
      limit: parsedLimit,
      offset: parsedOffset,
      hasMore: parsedOffset + parsedLimit < count
    });
    
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch posts',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * POST /api/posts
 * Create a new post
 */
app.post('/api/posts',
  authMiddleware,
  limiters.posts,
  validate(postSchema),
  async (req, res) => {
    try {
      const { content, mood } = req.body;
      
      // Moderate content (redact sensitive info)
      const moderationResult = moderate(content);
      const moderatedContent = moderationResult.moderatedText;
      
      // Create post in Supabase
      const { data: newPost, error: postError } = await supabaseAdmin
        .from('posts')
        .insert([{
          author: 'Anonymous User',
          content: moderatedContent,
          mood: mood,
          support_count: 0,
          comment_count: 0
        }])
        .select()
        .single();
      
      if (postError) {
        console.error('Create post error:', postError);
        return res.status(500).json({ 
          error: 'Failed to create post',
          code: 'DB_ERROR'
        });
      }
      
      res.status(201).json({
        success: true,
        post: newPost,
        moderated: moderationResult.wasModified
      });
      
    } catch (error) {
      console.error('Post creation error:', error);
      res.status(500).json({ 
        error: 'Failed to create post',
        code: 'SERVER_ERROR'
      });
    }
  }
);

/**
 * GET /api/posts/:id
 * Get a single post by ID
 */
app.get('/api/posts/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Post not found',
          code: 'NOT_FOUND'
        });
      }
      console.error('Get post error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch post',
        code: 'DB_ERROR'
      });
    }
    
    res.json({
      success: true,
      post: post
    });
    
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch post',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * POST /api/posts/:id/support
 * Toggle support on a post
 */
app.post('/api/posts/:id/support', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const anonymousId = req.anonymousId;
  
  try {
    // Check if already supported
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('post_supports')
      .select('id')
      .eq('post_id', id)
      .eq('user_anonymous_id', anonymousId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Check support error:', checkError);
      return res.status(500).json({ 
        error: 'Failed to check support status',
        code: 'DB_ERROR'
      });
    }
    
    if (existing) {
      // Remove support
      const { error: deleteError } = await supabaseAdmin
        .from('post_supports')
        .delete()
        .eq('id', existing.id);
      
      if (deleteError) {
        console.error('Remove support error:', deleteError);
        return res.status(500).json({ 
          error: 'Failed to remove support',
          code: 'DB_ERROR'
        });
      }
    } else {
      // Add support
      const { error: insertError } = await supabaseAdmin
        .from('post_supports')
        .insert([{
          post_id: id,
          user_anonymous_id: anonymousId
        }]);
      
      if (insertError) {
        console.error('Add support error:', insertError);
        return res.status(500).json({ 
          error: 'Failed to add support',
          code: 'DB_ERROR'
        });
      }
    }
    
    // Get updated post with new support count
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('support_count')
      .eq('id', id)
      .single();
    
    if (postError) {
      console.error('Get post after support error:', postError);
      return res.status(500).json({ 
        error: 'Failed to get updated post',
        code: 'DB_ERROR'
      });
    }
    
    res.json({
      success: true,
      action: existing ? 'removed' : 'added',
      support_count: post.support_count
    });
    
  } catch (error) {
    console.error('Toggle support error:', error);
    res.status(500).json({ 
      error: 'Failed to update support',
      code: 'SERVER_ERROR'
    });
  }
});

// ========== COMMENTS ENDPOINTS ==========

/**
 * GET /api/posts/:id/comments
 * Get comments for a post
 */
app.get('/api/posts/:id/comments', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  
  try {
    const parsedLimit = Math.min(parseInt(limit) || 50, 100);
    const parsedOffset = parseInt(offset) || 0;
    
    const { data: comments, error, count } = await supabaseAdmin
      .from('comments')
      .select('*', { count: 'exact' })
      .eq('post_id', id)
      .order('created_at', { ascending: true })
      .range(parsedOffset, parsedOffset + parsedLimit - 1);
    
    if (error) {
      console.error('Get comments error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch comments',
        code: 'DB_ERROR'
      });
    }
    
    res.json({
      success: true,
      comments: comments,
      total: count,
      limit: parsedLimit,
      offset: parsedOffset
    });
    
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch comments',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * POST /api/posts/:id/comments
 * Add a comment to a post
 */
app.post('/api/posts/:id/comments',
  authMiddleware,
  limiters.comments,
  validate(commentSchema),
  async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    
    try {
      // Check if post exists
      const { data: post, error: postCheck } = await supabaseAdmin
        .from('posts')
        .select('id')
        .eq('id', id)
        .single();
      
      if (postCheck) {
        return res.status(404).json({ 
          error: 'Post not found',
          code: 'NOT_FOUND'
        });
      }
      
      // Moderate content
      const moderationResult = moderate(content);
      const moderatedContent = moderationResult.moderatedText;
      
      // Create comment
      const { data: newComment, error: commentError } = await supabaseAdmin
        .from('comments')
        .insert([{
          post_id: id,
          author: 'Anonymous User',
          content: moderatedContent
        }])
        .select()
        .single();
      
      if (commentError) {
        console.error('Create comment error:', commentError);
        return res.status(500).json({ 
          error: 'Failed to create comment',
          code: 'DB_ERROR'
        });
      }
      
      res.status(201).json({
        success: true,
        comment: newComment,
        moderated: moderationResult.wasModified
      });
      
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ 
        error: 'Failed to add comment',
        code: 'SERVER_ERROR'
      });
    }
  }
);

// ========== AI CHAT ENDPOINT ==========

/**
 * POST /api/chat
 * Send a message to AI chat companion
 * Note: This is a simplified version. For full AI integration, 
 * you'll need to add OpenAI or Anthropic API keys
 */
app.post('/api/chat',
  authMiddleware,
  limiters.chat,
  validate(chatSchema),
  async (req, res) => {
    const { message } = req.body;
    
    try {
      // Check for crisis keywords first
      if (detectCrisis(message)) {
        const crisisResponse = getCrisisResponse();
        return res.json(crisisResponse);
      }
      
      // Moderate the user message
      const moderatedMessage = moderateContent(message);
      
      // For now, return a simple response
      const simpleResponses = [
        "Thank you for sharing that with me. How does that make you feel?",
        "I hear you. It's important to acknowledge these feelings. Would you like to explore this more?",
        "That sounds meaningful. What do you think is contributing to these feelings?",
        "I appreciate you opening up. Sometimes just talking about things helps. Tell me more.",
        "It takes courage to share. What support would be most helpful for you right now?"
      ];
      
      const randomResponse = simpleResponses[Math.floor(Math.random() * simpleResponses.length)];
      
      res.json({
        success: true,
        response: randomResponse,
        moderated: moderatedMessage !== message,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ 
        error: 'Failed to generate response',
        code: 'SERVER_ERROR'
      });
    }
  }
);

// ========== ERROR HANDLING ==========

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// ========== START SERVER ==========

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   SafeHaven Auth & Security Backend                       ║
║                                                              ║
║   Server running on: http://localhost:${PORT}                ║
║   Environment: ${process.env.NODE_ENV || 'development'}      ║
║   Supabase: ${process.env.SUPABASE_URL ? 'Connected' : 'Not configured'}     ║
║                                                              ║
║   Endpoints:                                                 ║
║   • POST   /api/session          - Create session            ║
║   • GET    /api/session/validate - Validate session          ║
║   • GET    /api/posts            - Get all posts             ║
║   • POST   /api/posts            - Create post               ║
║   • GET    /api/posts/:id        - Get single post           ║
║   • POST   /api/posts/:id/support - Toggle support           ║
║   • GET    /api/posts/:id/comments - Get comments            ║
║   • POST   /api/posts/:id/comments - Add comment             ║
║   • POST   /api/chat             - AI chat message           ║
║   • GET    /health               - Health check              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
