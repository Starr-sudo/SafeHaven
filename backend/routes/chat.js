/**
 * Chat Routes
 * Handles AI chat interactions
 */

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimit');
const validate = require('../middleware/validate');
const { chatSchema } = require('../validation/schemas');
const { detectCrisis, getCrisisResponse } = require('../utils/crisis');

// POST /api/chat - Send a message and get AI response
router.post('/', authMiddleware, chatLimiter, validate(chatSchema), async (req, res) => {
  const { message, conversation_history = [] } = req.body;
  const { anonymous_id, id: userId } = req.user;
  
  try {
    // Check for crisis first
    if (detectCrisis(message)) {
      return res.json(getCrisisResponse());
    }
    
    // Get or create chat session
    let { data: session } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('user_anonymous_id', anonymous_id)
      .order('last_message_at', { ascending: false })
      .limit(1)
      .single();
    
    if (!session) {
      const { data: newSession } = await supabase
        .from('chat_sessions')
        .insert([{ user_anonymous_id: anonymous_id }])
        .select()
        .single();
      session = newSession;
    }
    
    // Save user message
    await supabase
      .from('chat_messages')
      .insert([{
        session_id: session.id,
        role: 'user',
        content: message
      }]);
    
    // Generate AI response (simple for now - replace with OpenAI/Claude later)
    const simpleResponses = [
      "Thank you for sharing that with me. How does that make you feel?",
      "I hear you. It's important to acknowledge these feelings. Would you like to explore this more?",
      "That sounds meaningful. What do you think is contributing to these feelings?",
      "I appreciate you opening up. Sometimes just talking about things helps. Tell me more.",
      "It takes courage to share. What support would be most helpful for you right now?"
    ];
    
    const aiResponse = simpleResponses[Math.floor(Math.random() * simpleResponses.length)];
    
    // Save AI response
    await supabase
      .from('chat_messages')
      .insert([{
        session_id: session.id,
        role: 'assistant',
        content: aiResponse
      }]);
    
    // Update session
    await supabase
      .from('chat_sessions')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', session.id);
    
    res.json({
      response: aiResponse,
      session_id: session.id
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

module.exports = router;