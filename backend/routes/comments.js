/**
 * Comments Routes
 * Handles all comment-related endpoints
 */

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const { commentLimiter } = require('../middleware/rateLimit');
const validate = require('../middleware/validate');
const { commentSchema } = require('../validation/schemas');
const { moderateContent } = require('../utils/moderation');

// GET /api/posts/:id/comments - Get comments for a post
router.get('/:id/comments', authMiddleware, async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    res.json({ comments });
    
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/posts/:id/comments - Add a comment
router.post('/:id/comments', authMiddleware, commentLimiter, validate(commentSchema), async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const { anonymous_id } = req.user;
  
  try {
    const moderatedContent = moderateContent(content);
    
    const { data: comment, error } = await supabase
      .from('comments')
      .insert([{
        post_id: id,
        author: 'Anonymous User',
        content: moderatedContent
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ comment });
    
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;