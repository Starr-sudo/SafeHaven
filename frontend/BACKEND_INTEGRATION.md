# SafeHaven Backend Integration Guide

This guide shows how to connect the frontend to the backend API.

---

## Base URL

```js
const API_URL = 'http://localhost:3001';
```
If using Vite:
```js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```
1. Anonymous User ID

Create a helper to generate/store a user ID.
```js
export const getUserId = () => {
  let userId = localStorage.getItem('safehaven_user_id');

  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('safehaven_user_id', userId);
  }

  return userId;
};
```
Headers helper:
```js
export const authHeaders = () => ({
  'Content-Type': 'application/json',
  'x-anonymous-user-id': getUserId()
});
2. Get Posts
export const getPosts = async () => {
  const res = await fetch(`${API_URL}/api/posts`);
  return res.json();
};
```
3. Create Post
```js
export const createPost = async (content, mood) => {
  const res = await fetch(`${API_URL}/api/posts`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ content, mood })
  });

  return res.json();
};
```
4. Support / Unsupport Post
```js
export const toggleSupport = async (postId) => {
  const res = await fetch(`${API_URL}/api/posts/${postId}/support`, {
    method: 'POST',
    headers: authHeaders()
  });

  return res.json();
};
```
5. Get Comments
```js
export const getComments = async (postId) => {
  const res = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
    headers: {
      'x-anonymous-user-id': getUserId()
    }
  });

  return res.json();
};
```
6. Add Comment
```js
export const addComment = async (postId, content) => {
  const res = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ content })
  });

  return res.json();
};
```
7. Chatbot
```js
export const sendChatMessage = async (message, sessionId, conversationHistory) => {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      message,
      session_id: sessionId,
      conversation_history: conversationHistory
    })
  });

  return res.json();
};
```
8. Example Chat Usage
```js
const handleSendMessage = async () => {
  const data = await sendChatMessage(message, sessionId, messages);

  setSessionId(data.session_id);

  setMessages((prev) => [
    ...prev,
    { role: 'user', content: message },
    { role: 'assistant', content: data.response }
  ]);
};
```
9. Example Post Creation
```js
const handleCreatePost = async () => {
  const data = await createPost(content, mood);

  if (data.post) {
    setPosts((prev) => [data.post, ...prev]);
  }
};
```
10. Environment Variable (Optional)
```js
VITE_API_URL=http://localhost:3001
```

Notes:

Remove all hardcoded/mock data
Ensure headers include x-anonymous-user-id

Use:

GET for fetching
POST for creating
Chat endpoint: /api/chat
Posts endpoint: /api/posts
Comments endpoint: /api/posts/:id/comments
Backend must be running
node server.js