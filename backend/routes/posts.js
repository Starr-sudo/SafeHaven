/**
 * Posts Routes
 * Handles all post-related endpoints
 */

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const { postLimiter } = require('../middleware/rateLimit');
const validate = require('../middleware/validate');
const { postSchema } = require('../validation/schemas');
const { moderateContent } = require('../utils/moderation');

// GET /api/posts - Get all posts (paginated)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { limit = 20, offset = 0, mood } = req.query;
    
    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    if (mood && ['Positive', 'Neutral', 'Negative'].includes(mood)) {
      query = query.eq('mood', mood);
    }
    
    const { data: posts, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      posts,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// POST /api/posts - Create a new post
router.post('/', authMiddleware, postLimiter, validate(postSchema), async (req, res) => {
  try {
    const { content, mood } = req.body;
    const moderatedContent = moderateContent(content);
    
    const { data: post, error } = await supabase
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
    
    if (error) throw error;
    
    res.status(201).json({ post });
    
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// POST /api/posts/:id/support - Toggle support on a post
router.post('/:id/support', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { anonymous_id } = req.user;
  
  try {
    // Check if already supported
    const { data: existing } = await supabase
      .from('post_supports')
      .select('id')
      .eq('post_id', id)
      .eq('user_anonymous_id', anonymous_id)
      .single();
    
    if (existing) {
      // Remove support
      await supabase
        .from('post_supports')
        .delete()
        .eq('id', existing.id);
    } else {
      // Add support
      await supabase
        .from('post_supports')
        .insert([{
          post_id: id,
          user_anonymous_id: anonymous_id
        }]);
    }
    
    // Get updated post
    const { data: post } = await supabase
      .from('posts')
      .select('support_count')
      .eq('id', id)
      .single();
    
    res.json({
      action: existing ? 'removed' : 'added',
      support_count: post.support_count
    });
    
  } catch (error) {
    console.error('Toggle support error:', error);
    res.status(500).json({ error: 'Failed to update support' });
  }
});

module.exports = router;