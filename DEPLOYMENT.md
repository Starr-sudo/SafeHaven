# Deploying SafeHaven to Vercel (Contributor Guide)

This guide explains how to deploy your own fork of SafeHaven to Vercel. You do **not** need to be the repository owner — you only need a free Vercel account and your own copies of the required third-party credentials.

---

## Prerequisites

Before you start, create free accounts for the services SafeHaven depends on:

| Service | What it provides | Sign-up link |
|---------|-----------------|--------------|
| [Vercel](https://vercel.com) | Hosting for both frontend and backend | https://vercel.com/signup |
| [Supabase](https://supabase.com) | Postgres database | https://supabase.com/dashboard |
| [Google AI Studio](https://aistudio.google.com) | Gemini API key for AI chat | https://aistudio.google.com/app/apikey |

---

## Step 1 — Fork the repository

1. Open https://github.com/Starr-sudo/SafeHaven
2. Click **Fork** (top-right) to create a copy under your own GitHub account.

---

## Step 2 — Set up Supabase

1. Create a new **Supabase project**.
2. From your project's **Settings → API** page, copy:
   - **Project URL** → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - **anon / public key** → `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`
3. Run the database migrations (or manually create the tables) described in [`backend/README.md`](./backend/README.md).

---

## Step 3 — Deploy the backend

The backend is a Node.js/Express API that runs as a Vercel serverless function.

### Via the Vercel Dashboard (recommended)

1. Go to https://vercel.com/new and click **Import Git Repository**.
2. Select your fork.
3. Set the **Root Directory** to `backend`.
4. Vercel will auto-detect the `vercel.json` inside `backend/` — no extra build settings are needed.
5. Under **Environment Variables**, add:

   | Name | Value |
   |------|-------|
   | `SUPABASE_URL` | Your Supabase project URL |
   | `SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `GEMINI_API_KEY` | Your Google Gemini API key |

6. Click **Deploy**.
7. Once deployed, copy the production URL (e.g. `https://safehaven-backend-xxxx.vercel.app`). You will need it in Step 4.

### Via the Vercel CLI

```bash
npm install -g vercel
cd backend
vercel --prod
```

Follow the prompts and set the same environment variables when asked.

---

## Step 4 — Deploy the frontend

The frontend is a React + Vite SPA.

### Via the Vercel Dashboard (recommended)

1. Go to https://vercel.com/new and click **Import Git Repository** again (separate project).
2. Select your fork.
3. Set the **Root Directory** to `frontend`.
4. Vercel will auto-detect the `vercel.json` inside `frontend/` — no extra build settings are needed.
5. Under **Environment Variables**, add:

   | Name | Value |
   |------|-------|
   | `VITE_API_URL` | Your backend URL from Step 3 (e.g. `https://safehaven-backend-xxxx.vercel.app`) |
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

6. Click **Deploy**.

### Via the Vercel CLI

```bash
cd frontend
vercel --prod
```

Follow the prompts and set the same environment variables when asked.

---

## Step 5 — Verify

Open your frontend's Vercel URL. You should see the SafeHaven app. Test the community feed and the AI chat to confirm both the database and Gemini integrations are working.

---

## Environment variable reference

### `backend/.env.example`

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_gemini_api_key
```

### `frontend/.env.example`

```
VITE_API_URL=https://your-backend.vercel.app
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Security:** Never commit real credentials to source control. The `.env` files are listed in `.gitignore` by default.

---

## Local development

If you want to run the project locally before deploying:

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env   # fill in your real credentials
npm install
npm run dev            # runs on http://localhost:3001

# Terminal 2 — frontend
cd frontend
cp .env.example .env   # set VITE_API_URL=http://localhost:3001
npm install
npm run dev            # runs on http://localhost:5173
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Frontend shows blank page after navigation | The `vercel.json` `rewrites` rule in `frontend/` handles this — make sure it was committed. |
| Backend returns 500 errors | Check that all three backend environment variables are set correctly in your Vercel project settings. |
| CORS errors in the browser | Ensure `VITE_API_URL` matches the exact domain of your deployed backend (no trailing slash). |
| Gemini chat not responding | Verify your `GEMINI_API_KEY` is valid and has quota remaining in Google AI Studio. |
