# SafeHaven Backend

Express.js backend for the SafeHaven mental health support platform. Provides API endpoints for community posts, comments, support system, and AI-powered chat.

## Features

- **Community Posts API** - Create, retrieve, and filter posts by mood
- **Support System** - Toggle support/like count on posts with duplicate prevention
- **Comments** - Full comment threading on posts
- **AI Chat** - Google Gemini-powered mental health support conversations
- **Authentication** - Anonymous user ID validation via headers
- **Rate Limiting** - Request throttling to prevent abuse
- **Content Moderation** - Automatic content filtering
- **Input Validation** - Zod schema validation for all requests
- **Supabase Integration** - PostgreSQL database with built-in security

## Tech Stack

- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Generative AI (Gemini 2.5 Flash)
- **Validation**: Zod
- **Rate Limiting**: Express Rate Limit
- **CORS**: Enabled for frontend integration
- **Environment**: Node.js with ES modules

## Prerequisites

- Node.js v18+
- npm or yarn
- Supabase account and project
- Google Gemini API key

## Installation

1. **Clone the repository**:
   ```bash
   cd SafeHaven/backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables** - Create a `.env` file:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Set up database** - Run the SQL schema in your Supabase instance (see [Database Setup](#database-setup) below)

## Running the Server

**Development mode**:
```bash
npm start
```

**Watch mode** (with auto-reload):
```bash
npm run dev
```

Server runs on `http://localhost:3001`

## API Endpoints

### Posts

#### GET `/api/posts`
Retrieve all community posts with optional filtering.

**Query Parameters**:
- `limit` (default: 20) - Number of posts to return
- `offset` (default: 0) - Pagination offset
- `mood` (optional) - Filter by mood: "Positive", "Neutral", or "Negative"

**Example**:
```bash
curl http://localhost:3001/api/posts?limit=10&mood=Positive
```

**Response**:
```json
{
  "posts": [
    {
      "id": "uuid",
      "author": "Anonymous User",
      "content": "I'm feeling great today!",
      "mood": "Positive",
      "support_count": 5,
      "comment_count": 2,
      "created_at": "2026-03-23T10:00:00Z"
    }
  ],
  "limit": 10,
  "offset": 0
}
```

#### POST `/api/posts`
Create a new community post. **Requires authentication**.

**Headers**:
```
Content-Type: application/json
x-anonymous-user-id: user_[timestamp]_[randomstring]
```

**Body**:
```json
{
  "content": "How are you feeling today?",
  "mood": "Neutral"
}
```

**Response** (201):
```json
{
  "post": {
    "id": "uuid",
    "author": "Anonymous User",
    "content": "How are you feeling today?",
    "mood": "Neutral",
    "support_count": 0,
    "comment_count": 0,
    "created_at": "2026-03-23T10:00:00Z"
  }
}
```

### Support

#### POST `/api/posts/:id/support`
Toggle support (like) on a post. **Requires authentication**.

**Headers**:
```
Content-Type: application/json
x-anonymous-user-id: user_[timestamp]_[randomstring]
```

**Body**: `{}`

**Response**:
```json
{
  "action": "added",
  "support_count": 6
}
```

### Comments

#### GET `/api/posts/:id/comments`
Get all comments for a post. **Requires authentication**.

**Response**:
```json
{
  "comments": [
    {
      "id": "uuid",
      "post_id": "uuid",
      "author": "Anonymous User",
      "content": "I can relate to this!",
      "created_at": "2026-03-23T10:05:00Z"
    }
  ]
}
```

#### POST `/api/posts/:id/comments`
Add a comment to a post. **Requires authentication**.

**Headers**:
```
Content-Type: application/json
x-anonymous-user-id: user_[timestamp]_[randomstring]
```

**Body**:
```json
{
  "content": "I can relate to this!"
}
```

**Response** (201):
```json
{
  "comment": {
    "id": "uuid",
    "post_id": "uuid",
    "author": "Anonymous User",
    "content": "I can relate to this!",
    "created_at": "2026-03-23T10:05:00Z"
  }
}
```

### Chat

#### POST `/api/chat`
Send a message to the AI chat companion. **Requires authentication**.

**Headers**:
```
Content-Type: application/json
x-anonymous-user-id: user_[timestamp]_[randomstring]
```

**Body**:
```json
{
  "message": "I'm feeling anxious",
  "session_id": "optional-uuid",
  "conversation_history": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": "AI response"
    }
  ]
}
```

**Response**:
```json
{
  "response": "I hear that you're feeling anxious. That's a valid emotion...",
  "session_id": "uuid"
}
```

## Database Setup

Run these SQL commands in your Supabase instance to create tables:

```sql
-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author TEXT DEFAULT 'Anonymous User',
  content TEXT NOT NULL,
  mood TEXT NOT NULL CHECK (mood IN ('Positive', 'Neutral', 'Negative')),
  support_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_mood ON posts(mood);

-- Post supports table
CREATE TABLE post_supports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_anonymous_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_anonymous_id)
);

CREATE INDEX idx_post_supports_post_id ON post_supports(post_id);
CREATE INDEX idx_post_supports_user ON post_supports(user_anonymous_id);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author TEXT DEFAULT 'Anonymous User',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Chat sessions table
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_anonymous_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_anonymous_id);
```

## Architecture

```
server.js           # Main Express app and route handlers
├── config/
│   └── supabase.js     # Supabase client initialization
├── middleware/
│   ├── auth.js         # Anonymous user ID validation
│   ├── rateLimit.js    # Request throttling
│   └── validate.js     # Zod schema validation
├── utils/
│   ├── crisis.js       # Crisis detection and responses
│   ├── moderation.js   # Content filtering
│   └── validation/
│       └── schemas.js  # Zod validation schemas
```

## Security Features

- **Anonymous Authentication**: Users identified by session-generated ID in header
- **Rate Limiting**: Different limits for posts (10/hour), comments (20/hour), chat (30/hour)
- **Content Moderation**: Filters harmful content before storage
- **Input Validation**: All inputs validated against Zod schemas
- **CORS**: Configured for frontend cross-origin requests
- **SQL Injection Protection**: Supabase QueryBuilder prevents injection

## Rate Limits

- **General**: 100 requests/15 minutes per IP
- **Posts**: 10 posts/hour per user
- **Comments**: 20 comments/hour per user
- **Chat**: 30 messages/hour per user

## Error Handling

All errors return appropriate HTTP status codes:
- `400` - Bad request (validation error)
- `401` - Missing/invalid authentication
- `429` - Rate limit exceeded
- `500` - Server error

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Your Supabase anon public key |
| `GEMINI_API_KEY` | Your Google Gemini API key |

## Middleware Stack

1. **CORS** - Cross-origin resource sharing
2. **JSON Parser** - Parse JSON request bodies
3. **General Rate Limiter** - 100 req/15min per IP
4. **Route Handlers** - API endpoints
5. **Auth Middleware** - Validate user ID (protected routes)
6. **Route-specific Limiters** - Posts, comments, chat
7. **Validation Middleware** - Zod schema validation
8. **Database Operations** - Supabase queries
9. **Response** - Send JSON response

## Performance Considerations

- Database indexes on frequently queried fields (`created_at`, `mood`, `post_id`)
- Pagination support for posts endpoint
- Efficient support toggle (prevents duplicates with UNIQUE constraint)
- Rate limiting prevents abuse and excessive database load

## Deployment

### Vercel
```bash
vercel deploy
```

### Fly.io
```bash
flyctl launch
flyctl deploy
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
```

## Development

**File Structure**:
```
backend/
├── server.js              # Main app
├── config/
├── middleware/
├── utils/
├── validation/
├── package.json
└── .env
```

**Adding new endpoints**:
1. Create validation schema in `validation/schemas.js`
2. Add middleware as needed
3. Add route handler in `server.js`
4. Test with curl or Postman

## Troubleshooting

**"Missing user ID" error**
- Ensure `x-anonymous-user-id` header is included in requests
- Format should be `user_[timestamp]_[random]`

**"Cannot read properties of null" error**
- Post ID may not exist in database
- Verify post was created successfully first

**Supabase connection error**
- Check `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- Verify internet connection
- Check Supabase project status

## Support

For issues with the backend, check:
1. Console logs in terminal
2. Network tab in browser dev tools
3. Supabase dashboard for database issues
4. Rate limit headers in response
