/**
 * SafeHaven Backend Server
 * Based on the Safehaven Backend Integration Guide
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const { createClient } = require('@supabase/supabase-js');

// ============================================
// Supabase Client (from README)
// ============================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// CORS Configuration (from README)
// ============================================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// ============================================
// Rate Limiting (from README)
// ============================================
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: 'Too many requests, please try again later.'
});

const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 posts per hour
  message: 'Too many posts, please try again later.'
});

// ============================================
// Input Validation (from README)
// ============================================
const createPostSchema = z.object({
  content: z.string().min(1).max(2000),
  mood: z.enum(['Positive', 'Neutral', 'Negative'])
});

// ============================================
// Content Moderation (from README)
// ============================================
function moderateContent(content) {
  const prohibitedPatterns = [
    /\b\d{3}-\d{3}-\d{4}\b/g, // Phone numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails
    /\b(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/\S*)?\b/g // URLs
  ];
  
  let cleanContent = content;
  prohibitedPatterns.forEach(pattern => {
    cleanContent = cleanContent.replace(pattern, '[REDACTED]');
  });
  
  return cleanContent;
}

// ============================================
// Crisis Detection (from README)
// ============================================
function detectCrisis(message) {
  const crisisKeywords = [
    'suicide', 'kill myself', 'end my life', 'want to die',
    'self harm', 'cutting', 'hurt myself', 'overdose'
  ];
  
  const lowerMessage = message.toLowerCase();
  return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
}

// ============================================
// GET /api/posts (from README)
// ============================================
app.get('/api/posts', async (req, res) => {
  const { limit = 20, offset = 0, mood } = req.query;
  
  try {
    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (mood) {
      query = query.eq('mood', mood);
    }
    
    const { data, count, error } = await query;
    
    if (error) throw error;
    
    res.json({
      posts: data,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// POST /api/posts (from README)
// ============================================
app.post('/api/posts', postLimiter, async (req, res) => {
  const { content, mood } = req.body;
  
  // Validation
  if (!content || content.length < 1 || content.length > 2000) {
    return res.status(400).json({ error: 'Invalid content length' });
  }
  
  if (!['Positive', 'Neutral', 'Negative'].includes(mood)) {
    return res.status(400).json({ error: 'Invalid mood' });
  }
  
  try {
    // Moderate content
    const moderatedContent = moderateContent(content);
    
    const { data, error } = await supabase
      .from('posts')
      .insert([{ 
        author: 'Anonymous User',
        content: moderatedContent, 
        mood 
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ post: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// POST /api/posts/:id/support (from README)
// ============================================
app.post('/api/posts/:id/support', async (req, res) => {
  const { id } = req.params;
  const { user_anonymous_id } = req.body;
  
  if (!user_anonymous_id) {
    return res.status(400).json({ error: 'Missing user_anonymous_id' });
  }
  
  try {
    // Check if already supported
    const { data: existing } = await supabase
      .from('post_supports')
      .select('id')
      .eq('post_id', id)
      .eq('user_anonymous_id', user_anonymous_id)
      .single();
    
    if (existing) {
      // Remove support
      await supabase
        .from('post_supports')
        .delete()
        .eq('id', existing.id);
      
      const { data: post } = await supabase
        .from('posts')
        .select('support_count')
        .eq('id', id)
        .single();
      
      return res.json({
        action: 'removed',
        support_count: post.support_count
      });
    } else {
      // Add support
      await supabase
        .from('post_supports')
        .insert([{ post_id: id, user_anonymous_id }]);
      
      const { data: post } = await supabase
        .from('posts')
        .select('support_count')
        .eq('id', id)
        .single();
      
      return res.json({
        action: 'added',
        support_count: post.support_count
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET /api/posts/:id/comments (from README)
// ============================================
app.get('/api/posts/:id/comments', async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// POST /api/posts/:id/comments (from README)
// ============================================
app.post('/api/posts/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  
  if (!content || content.length < 1 || content.length > 1000) {
    return res.status(400).json({ error: 'Invalid comment length' });
  }
  
  try {
    const moderatedContent = moderateContent(content);
    
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        post_id: id,
        author: 'Anonymous User',
        content: moderatedContent
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ comment: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// POST /api/chat (from README)
// ============================================
app.post('/api/chat', chatLimiter, async (req, res) => {
  const { message, session_id, conversation_history = [] } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    // Crisis detection (from README)
    if (detectCrisis(message)) {
      return res.json({
        response: `I'm really concerned about what you're sharing. Your safety is the top priority. Please reach out to one of these resources immediately:

• National Suicide Prevention Lifeline: 988 (US)
• Crisis Text Line: Text HOME to 741741
• International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

If you're in immediate danger, please call emergency services (911 in the US) or go to the nearest emergency room. I'm here to support you, but I'm not equipped to handle crisis situations.`,
        crisis_detected: true
      });
    }
    
    // Create or get session
    let sessionId = session_id;
    if (!sessionId) {
      const { data } = await supabase
        .from('chat_sessions')
        .insert([{ user_anonymous_id: req.headers['x-anonymous-user-id'] }])
        .select()
        .single();
      sessionId = data.id;
    }
    
    // Save user message
    await supabase
      .from('chat_messages')
      .insert([{
        session_id: sessionId,
        role: 'user',
        content: message
      }]);
    
    // Simple response (in production, use OpenAI/Claude)
    const aiResponse = "Thank you for sharing that with me. How does that make you feel?";
    
    // Save AI response
    await supabase
      .from('chat_messages')
      .insert([{
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse
      }]);
    
    // Update session
    await supabase
      .from('chat_sessions')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', sessionId);
    
    res.json({
      response: aiResponse,
      session_id: sessionId
    });
    
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ SafeHaven Backend running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api/posts`);
});