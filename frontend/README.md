# SafeHaven Frontend

React + TypeScript frontend for SafeHaven mental health support platform. Features a community feed with mood-based posting and an AI-powered chat companion.

## Features

### Community Feed

- **Anonymous Posting** - Share thoughts with mood indicators (Positive, Neutral, Struggling)
- **Support System** - Give/receive support on posts with heart reactions
- **Comments** - Full threaded comments on community posts
- **Mood Filtering** - Filter posts by emotional tone
- **Real-time Updates** - View new posts and interactions instantly
- **Warm Design** - Supportive, color-coded mood visualization

### AI Chat Companion

- **Context-Aware Responses** - AI adapts to conversation history
- **Emotion Detection** - Understands anxiety, depression, stress, loneliness, etc.
- **Topic Extraction** - Recognizes themes (work, relationships, sleep, therapy)
- **Supportive Tone** - Non-judgmental, empathetic responses
- **Session Management** - Maintains conversation continuity
- **Typing Indicators** - Visual feedback while AI is responding

### Privacy & Safety

- **Fully Anonymous** - No personal data collected
- **No Sign-up Required** - Immediate access without authentication
- **Clear Disclaimers** - Transparent about AI limitations
- **Mobile-Responsive** - Perfect experience on all devices
- **Accessible UI** - WCAG compliant design

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Routing**: React Router v7 (Data Mode)
- **Styling**: Tailwind CSS v4
- **UI Icons**: Lucide React
- **Build Tool**: Vite
- **HTTP Client**: Fetch API
- **Package Manager**: npm

## Prerequisites

- **Node.js** v18+ - [Download](https://nodejs.org/)
- **npm** v9+ or yarn
- **Backend Server** running on <http://localhost:3001> (optional - required for full features)

Check your versions:

```bash
node --version
npm --version
```

## Installation

1. **Clone the repository**:

   ```bash
   git clone <repo-url>
   cd SafeHaven/frontend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment** (optional):
   Create `.env` file:

   ```
   VITE_API_URL=http://localhost:3001
   ```

## Running the Application

### Development Mode

```bash
npm run dev
```

Opens at `http://localhost:5173` (exact port shown in terminal)

### Production Build

```bash
npm run build
```

Creates optimized build in `dist/` folder

### Deploy Preview

```bash
npm run preview
```

Preview production build locally

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx                 # Entry point
│   ├── app/
│   │   ├── App.tsx              # Root component
│   │   ├── routes.tsx           # Route definitions
│   │   ├── components/
│   │   │   ├── Layout.tsx       # Main layout wrapper
│   │   │   └── ui/              # Shadcn UI components
│   │   ├── pages/
│   │   │   ├── AIChat.tsx       # Chat page
│   │   │   └── CommunityFeed.tsx # Feed page
│   │   └── services/
│   │       ├── ai.ts           # AI chat API client
│   │       └── storage.ts      # Posts/comments API client
│   └── styles/
│       ├── index.css           # Global styles
│       ├── tailwind.css        # Tailwind config
│       └── theme.css           # Theme variables
├── index.html
├── vite.config.ts
└── package.json
```

## API Integration

### Backend Connection

The frontend connects to the backend API at `http://localhost:3001` (configurable via `VITE_API_URL`).

**Services**:

- **`src/app/services/storage.ts`** - Posts, comments, support
- **`src/app/services/ai.ts`** - AI chat responses

**Authentication**:
All API requests include an anonymous user ID header:

```
x-anonymous-user-id: user_[timestamp]_[randomstring]
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3001` | Backend API URL |

## Running Backend & Frontend Together

Open two terminals:

**Terminal 1 - Backend** (from `SafeHaven/backend/`):

```bash
npm start
```

Runs on `http://localhost:3001`

**Terminal 2 - Frontend** (from `SafeHaven/frontend/`):

```bash
npm run dev
```

Runs on `http://localhost:5173`

Then open your browser to `http://localhost:5173`

## Development Workflow

### Adding a New Route

1. Add route definition in `src/app/routes.tsx`
2. Create page component in `src/app/pages/`
3. Import in routes file
4. Navigation updates automatically via React Router

### Adding a New API Call

1. Add function in `src/app/services/`
2. Include authentication header with user ID
3. Handle errors gracefully
4. Return typed data

Example:

```typescript
export const getMyData = async (): Promise<Data[]> => {
  const userId = getUserId();
  const response = await fetch(`${API_URL}/api/data`, {
    headers: {
      "x-anonymous-user-id": userId,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const json = await response.json();
  return json.data;
};
```

### Styling

Uses Tailwind CSS v4 with custom theme:

- **Colors**: Purple/pink gradient primary, emerald accent
- **Components**: Pre-built shadcn UI components in `src/app/components/ui/`
- **Responsive**: Mobile-first design with `sm:`, `md:` breakpoints

### Using UI Components

All components imported from `src/app/components/ui/`:

```typescript
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";

export function MyComponent() {
  return (
    <Card>
      <Button>Click me</Button>
    </Card>
  );
}
```

## Features Breakdown

### Community Feed (`pages/CommunityFeed.tsx`)

**Capabilities**:

- Create posts with mood selection
- View feed of community posts
- Support posts with heart reactions
- View/add comments on posts (expands inline)
- Real-time count updates

**State Management**:

- Posts loaded on mount
- Expandable comments sections per post
- Local comment storage while typing

### AI Chat (`pages/AIChat.tsx`)

**Capabilities**:

- Send messages to AI companion
- View typing indicators
- Maintain conversation history
- Auto-scroll to latest messages
- Send on Enter (Shift+Enter for newline)

**Features**:

- Context-aware responses using conversation history
- Emotion detection from messages
- Supportive, empathetic tone
- Fallback local responses if backend unavailable

## Performance Optimizations

- **Code Splitting**: Route-based lazy loading
- **Tree Shaking**: Unused code removed in production build
- **Asset Optimization**: Vite handles image/font optimization
- **Caching**: Service-friendly API responses
- **Debouncing**: Form inputs don't hammer server

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

## Troubleshooting

### Backend Connection Issues

**Error**: "Cannot reach API"

- Check backend is running on port 3001
- Verify `VITE_API_URL` in `.env`
- Check CORS is enabled in backend

**Error**: "Missing user ID"

- Clear browser storage: `localStorage.clear()`
- Refresh page
- Check console for auth errors

### Build Issues

**Error**: "Port 5173 already in use"

```bash
# Find process on port 5173
lsof -i :5173
# Kill it
kill -9 <PID>
```

**Error**: "Module not found"

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### UI Not Loading

- Check Tailwind CSS compiled in dev tools
- Verify `tailwind.config.ts` includes all template paths
- Check for conflicting CSS

## Build & Deployment

### Build for Production

```bash
npm run build
```

Creates optimized `dist/` folder ready for deployment.

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Automatically detects Vite project and deploys.

### Deploy to Netlify

1. Push to GitHub
2. Connect repo to Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`

### Deploy to GitHub Pages

```bash
npm install -g gh-pages
npm run build
npx gh-pages -d dist
```

## Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview build locally |
| `npm run lint` | Run ESLint |

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes
3. Test locally: `npm run dev`
4. Commit: `git commit -m "Add my feature"`
5. Push: `git push origin feature/my-feature`
6. Open Pull Request

## Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Follows Prettier defaults
- **Linting**: ESLint configured
- **Components**: Functional components with hooks

## Security

- **No PII Storage**: Fully anonymous
- **HTTPS Only**: In production
- **XSS Protection**: React escapes content
- **CSRF Tokens**: Not needed (anonymous users)
- **Content Security Policy**: Configured in headers

## Accessibility

- **WCAG 2.1 AA Compliant**: Keyboard navigation
- **Screen Readers**: Semantic HTML, ARIA labels
- **Color Contrast**: WCAG AA standards met
- **Focus Management**: Clear focus indicators

## License

See [LICENSE](../LICENSE) in root directory.

## Support

For frontend issues:

1. Check console for error messages
2. Verify backend is running
3. Check browser DevTools Network tab
4. Review [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)

For feature requests or bugs, open an issue on GitHub.

---

**Made with ❤️ for mental health support**

1. **The application should now be running!** You'll see:
   - The Safehaven homepage with navigation
   - Community Feed page (default view)
   - AI Chat page accessible via navigation

## Building for Production

To create a production-ready build:

Using npm:

```bash
npm run build
```

The built files will be in the `dist` folder.

To preview the production build locally:

```bash
npm run preview
```

## Project Structure

```
safehaven/
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   └── ui/
│   │   ├── pages/
│   │   │   ├── AIChat.tsx
│   │   │   └── CommunityFeed.tsx
│   │   └── services/
│   │       ├── ai.ts
│   │       └── storage.ts
│   ├── imports/
│   │   └── pasted_text/
│   │       └── safehaven-ui-design.md
│   └── styles/
│       ├── fonts.css
│       ├── index.css
│       ├── tailwind.css
│       └── theme.css
├── package.json
├── postcss.config.mjs
├── vite.config.ts
├── .gitignore
├── README.md
└── ATTRIBUTIONS.md
```

## Key Components

### Storage Service (`src/app/services/storage.ts`)

- Manages community posts using localStorage
- Provides functions for creating posts, toggling support, and managing comments
- Includes TypeScript interfaces for type safety
- Ready for backend API integration (see inline comments)

### AI Service (`src/app/services/ai.ts`)

- Generates context-aware mental health support responses
- Detects emotions and extracts topics from user messages
- Maintains conversation context for more natural interactions
- Includes detailed notes on backend integration with OpenAI/Anthropic

## Data Persistence

Currently, the application uses **localStorage** to persist data:

- Community posts are saved across browser sessions
- AI chat history is maintained during the session
- Sample data is initialized on first load

**Note**: Clearing browser data will reset all content.

## Backend Integration (Future)

The codebase is structured for easy backend integration:

### For Community Posts

Replace localStorage calls in `src/app/services/storage.ts` with API calls:

- `GET /api/posts` - Fetch all posts
- `POST /api/posts` - Create new post
- `POST /api/posts/:id/support` - Toggle support
- `GET /api/posts/:id/comments` - Get comments
- `POST /api/posts/:id/comments` - Add comment

### For AI Chat

Replace the AI service in `src/app/services/ai.ts` with:

- `POST /api/chat` - Send message and conversation history to backend
- Backend securely calls OpenAI/Anthropic API with your API key
- Return AI response to frontend

**Recommended Backend Stack**:

- Database: PostgreSQL (via Supabase) or MongoDB
- API: Node.js/Express, Next.js API routes, or Supabase Edge Functions
- AI: OpenAI GPT-4, Anthropic Claude, or similar

Detailed integration notes are included as comments in both service files.

## Environment Variables (For Backend Integration)

When you add a backend, create a `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Security Note**: Never commit API keys to version control. The current implementation keeps all logic frontend-only to avoid this issue.

## Browser Compatibility

This application works best on:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Mobile browsers are fully supported with responsive design.

## Troubleshooting

### Port Already in Use

If port 5173 is already in use, Vite will automatically try the next available port. Check your terminal output.

### Build Errors

Ensure you're using Node.js v18 or higher:

```bash
node --version
```

### LocalStorage Not Persisting

Check your browser settings to ensure localStorage is enabled and not being cleared automatically.

## Important Notes

- **Not for Production PHI/PII**: This application is designed for development and prototyping. It is not intended for collecting personally identifiable information (PII) or protected health information (PHI) in a production environment without proper security measures.

- **Not Medical Advice**: The AI companion provides supportive conversation but is not a replacement for professional mental health care. Users in crisis should contact appropriate emergency services or crisis hotlines.

- **Sample Data**: The application includes sample posts to demonstrate functionality. These will appear on first load.

## Contributing

This is a development project. When adding features:

1. Follow the existing component structure
2. Update TypeScript interfaces when modifying data structures
3. Add backend integration notes in comments
4. Maintain mobile responsiveness
5. Test across different browsers

## License

This project is for educational and development purposes.

## Support

For questions or issues with the codebase, please refer to the inline comments in the service files (`storage.ts` and `ai.ts`) which provide detailed implementation guidance.

---

**Built with care for mental health support**
