// AI Service for mental health support conversations
// Uses Google Gemini AI via backend API

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  createdAt: number;
}

// API configuration
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Anonymous user ID management
let anonymousUserId = "";
let currentSessionId: string | null = null;

const getUserId = (): string => {
  if (!anonymousUserId) {
    anonymousUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return anonymousUserId;
};

// Generate AI responses using Google Gemini via backend API
export const generateAIResponse = async (
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> => {
  const userId = getUserId();

  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-anonymous-user-id": userId,
      },
      body: JSON.stringify({
        message: userMessage,
        session_id: currentSessionId,
        conversation_history: conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content
        }))
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();

    // Store session ID for future requests
    if (data.session_id) {
      currentSessionId = data.session_id;
    }

    return data.response || data.message || "Sorry, I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("AI API call failed:", error);

    // Provide user-friendly error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error("Unable to connect to the server. Please check your internet connection.");
    }

    throw new Error("I'm having trouble connecting right now. Please try again in a moment.");
  }
};

// Reset conversation session (useful for starting fresh conversations)
export const resetConversation = () => {
  currentSessionId = null;
};

// Get initial greeting message
export const getInitialGreeting = (): ChatMessage => {
  return {
    id: "initial_greeting",
    role: "assistant",
    content: "Hello, I'm here to listen and support you.",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    createdAt: Date.now(),
  };
};

// Get current session ID (for debugging/testing)
export const getCurrentSessionId = (): string | null => {
  return currentSessionId;
};

// Get current user ID (for debugging/testing)
export const getCurrentUserId = (): string => {
  return getUserId();
};
