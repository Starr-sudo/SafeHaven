/**
 * Crisis Detection Utility
 * Identifies crisis situations and returns resources
 */

// Crisis keywords
const crisisKeywords = [
  'suicide', 'kill myself', 'end my life', 'want to die',
  'self harm', 'cutting', 'hurt myself', 'overdose'
];

// Detect crisis in message
function detectCrisis(message) {
  const lowerMessage = message.toLowerCase();
  return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Get crisis response
function getCrisisResponse() {
  return {
    response: `I'm really concerned about what you're sharing. Your safety is the top priority. Please reach out to one of these resources immediately:

• National Suicide Prevention Lifeline: 988 (US)
• Crisis Text Line: Text HOME to 741741
• International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

If you're in immediate danger, please call emergency services (911 in the US) or go to the nearest emergency room. I'm here to support you, but I'm not equipped to handle crisis situations.`,
    crisis_detected: true
  };
}

module.exports = { detectCrisis, getCrisisResponse };