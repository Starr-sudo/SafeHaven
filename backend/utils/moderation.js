/**
 * Content Moderation Utility
 * Removes or redacts sensitive information from text
 */

/**
 * Redact sensitive information from text
 * - Phone numbers (US format and international)
 * - Email addresses
 * - URLs
 * - IP addresses
 * 
 * @param {string} text - The text to moderate
 * @returns {string} - Moderated text
 */
function moderateContent(text) {
  if (!text) return text;
  
  let moderated = text;
  
  // Redact US phone numbers: 123-456-7890 or (123) 456-7890 or 123.456.7890 or 123 456 7890
  moderated = moderated.replace(
    /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    '[PHONE REDACTED]'
  );
  
  // Redact international phone numbers (optional - adjust as needed)
  moderated = moderated.replace(
    /\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}/g,
    '[PHONE REDACTED]'
  );
  
  // Redact email addresses: name@domain.com, name@domain.co.uk, etc.
  moderated = moderated.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    '[EMAIL REDACTED]'
  );
  
  // Redact URLs: http://example.com, https://example.com, www.example.com, example.com
  moderated = moderated.replace(
    /\b(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/\S*)?\b/g,
    '[LINK REDACTED]'
  );
  
  // Redact IP addresses: 192.168.1.1
  moderated = moderated.replace(
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    '[IP REDACTED]'
  );
  
  return moderated;
}

/**
 * Check if content contains crisis keywords
 * Returns true if crisis detected
 */
function detectCrisis(text) {
  const crisisKeywords = [
    'suicide', 'kill myself', 'end my life', 'want to die', 'i want to die',
    'self harm', 'self-harm', 'cutting', 'hurt myself', 'overdose',
    'take my life', 'end it all', 'don\'t want to live', 'no reason to live'
  ];
  
  const lowerText = text.toLowerCase();
  return crisisKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Check if content contains profanity or inappropriate words
 */
function containsProfanity(text) {
  // Common profanity words (expand as needed)
  const profanityWords = [
    // Add words to filter - keep this list professional
    // This is a minimal list; you can expand based on your needs
  ];
  
  const lowerText = text.toLowerCase();
  return profanityWords.some(word => lowerText.includes(word));
}

/**
 * Full content moderation - redacts sensitive info and checks for issues
 */
function moderate(text) {
  const redacted = moderateContent(text);
  const hasProfanity = containsProfanity(redacted);
  const isCrisis = detectCrisis(redacted);
  
  return {
    originalText: text,
    moderatedText: redacted,
    wasModified: text !== redacted,
    hasProfanity,
    isCrisis,
    isClean: !hasProfanity && !isCrisis
  };
}

/**
 * Crisis response message to return to user
 */
const getCrisisResponse = () => {
  return {
    response: `I'm really concerned about what you're sharing. Your safety is the top priority.

Please reach out to one of these resources immediately:

• **National Suicide Prevention Lifeline:** Call or text 988 (US)
• **Crisis Text Line:** Text HOME to 741741
• **SAMHSA Helpline:** 1-800-662-4357
• **International Association for Suicide Prevention:** https://www.iasp.info/resources/Crisis_Centres/

If you're in immediate danger, please call emergency services (911 in the US) or go to the nearest emergency room.

I'm here to support you, but I'm not equipped to handle crisis situations. Please reach out to professional help right away.`,
    crisis_detected: true
  };
};

module.exports = {
  moderateContent,
  detectCrisis,
  containsProfanity,
  moderate,
  getCrisisResponse
};