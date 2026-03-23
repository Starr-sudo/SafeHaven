/**
 * Content Moderation Utility
 * Redacts sensitive information and checks for crisis
 */

// Redact sensitive information
function moderateContent(content) {
  if (!content) return content;
  
  let moderated = content;
  
  // Redact phone numbers (US format)
  moderated = moderated.replace(
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    '[REDACTED]'
  );
  
  // Redact email addresses
  moderated = moderated.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    '[REDACTED]'
  );
  
  // Redact URLs
  moderated = moderated.replace(
    /\b(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/\S*)?\b/g,
    '[REDACTED]'
  );
  
  return moderated;
}

export { moderateContent };