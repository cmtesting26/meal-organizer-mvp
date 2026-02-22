# Supabase Setup Guide (V1.2)

This guide walks you through setting up the Supabase backend for Meal Organizer's cloud sync and household features.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click **New Project**
3. Choose your organization
4. Set a project name (e.g., `meal-organizer`)
5. Set a strong database password (save this!)
6. **Select region**: Choose an EU region (e.g., `eu-central-1 Frankfurt`) for GDPR compliance
7. Click **Create new project**

## 2. Run the Database Migration

1. In the Supabase Dashboard, go to **SQL Editor**
2. Open the file `supabase/migrations/001_initial_schema.sql` from this repo
3. Copy-paste the entire SQL into the editor
4. Click **Run**

This creates:
- `households` table (top-level entity)
- `users` table (linked to auth.users)
- `recipes` table (household-scoped)
- `schedule_entries` table (household-scoped)
- `tags` table (household-scoped)
- Row-Level Security policies on all tables
- Database functions: `create_household`, `join_household`, `generate_invite`
- Auto-update trigger for `recipes.updated_at`

## 3. Configure Environment Variables

1. In the Supabase Dashboard, go to **Project Settings → API**
2. Copy the **Project URL** and **anon/public** key
3. Create a `.env` file in the project root (or update the existing one):

```
VITE_CORS_PROXY_URL=https://meal-organizer-cors-proxy.cmtesting26.workers.dev
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

4. If deploying to Netlify, add these same variables in **Site Settings → Environment Variables**

## 4. Configure Auth Settings

1. In the Supabase Dashboard, go to **Authentication → Settings**
2. Under **Email Auth**:
   - Enable **Email Signup**
   - Enable **Email Confirmations** (recommended for production, can disable for dev)
3. Under **URL Configuration**:
   - Set **Site URL** to your app URL (e.g., `https://meal-organizer-mvp.netlify.app` or `http://localhost:5173`)
   - Add **Redirect URLs**: `http://localhost:5173/**`, `https://meal-organizer-mvp.netlify.app/**`

## 5. Verify Setup

Start the dev server and create an account:

```bash
npm run dev
```

1. The app should show the Welcome screen (Create Account / Sign In / Continue without account)
2. Create an account with email/password
3. Set up a household
4. Verify that recipes and schedules sync to Supabase (check the Database tab in dashboard)

## Architecture

```
Browser (React SPA)
  ↕ Supabase JS Client
Supabase
  ├── Auth (email/password)
  ├── PostgreSQL (household-scoped tables)
  ├── Row-Level Security (per-household access)
  └── Database Functions (household management)
```

## Troubleshooting

**"Supabase not configured" warning**: Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in your `.env` file and restart the dev server.

**"User already belongs to a household"**: The `create_household` function prevents duplicate household creation. This is expected if you've already set up.

**RLS errors (403/permission denied)**: Ensure the migration ran successfully and all RLS policies were created. Check the **Authentication → Policies** tab in the dashboard.
