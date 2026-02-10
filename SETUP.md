# Setup Instructions

Follow these steps to get your Meal Organizer MVP up and running.

## Prerequisites

- Git installed
- Node.js 20.x or higher
- npm (comes with Node.js)
- GitHub account
- Netlify account (free tier)

## Quick Start (5 minutes)

### Step 1: Extract and Install

```bash
# Extract the archive
tar -xzf meal-organizer-mvp.tar.gz
cd meal-organizer-mvp

# Install dependencies
npm install

# Test locally (optional)
npm run dev
# Open http://localhost:5173 in your browser
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `meal-organizer-mvp`
3. Description: "A focused recipe management app for tracking meal rotation"
4. **Important:** Leave all checkboxes UNCHECKED (don't initialize with README)
5. Click "Create repository"

### Step 3: Push to GitHub

**Option A: Use the setup script (easiest)**

```bash
./setup-github.sh
# Follow the prompts and paste your GitHub repository URL
```

**Option B: Manual commands**

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/[YOUR-USERNAME]/meal-organizer-mvp.git

# Create develop branch
git checkout -b develop
git checkout main

# Push both branches
git push -u origin main
git push -u origin develop
```

### Step 4: Set Up Netlify

1. Go to https://netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub" and authorize Netlify
4. Select your `meal-organizer-mvp` repository
5. Netlify will auto-detect these settings (from netlify.toml):
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 20
6. Click "Deploy site"

### Step 5: Configure GitHub Actions (for CI/CD)

1. In Netlify, go to: Site settings → Site details
   - Copy your **Site ID** (under "Site information")
   
2. In Netlify, go to: User settings → Applications → Personal access tokens
   - Click "New access token"
   - Name it "GitHub Actions"
   - Copy the token (you won't see it again!)

3. In GitHub, go to: https://github.com/[YOUR-USERNAME]/meal-organizer-mvp/settings/secrets/actions
   - Click "New repository secret"
   - Add `NETLIFY_AUTH_TOKEN` with your token from step 2
   - Add `NETLIFY_SITE_ID` with your site ID from step 1

### Step 6: Verify Everything Works

1. Make a small change to README.md
2. Commit and push to `develop`:
   ```bash
   git add README.md
   git commit -m "Test CI/CD pipeline"
   git push origin develop
   ```
3. Go to GitHub → Actions tab
4. Watch your CI/CD pipeline run!
5. Check Netlify for the staging deployment

## Troubleshooting

### "npm install" fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and try again
rm -rf node_modules package-lock.json
npm install
```

### "npm run dev" shows errors

```bash
# Make sure you're using Node.js 20+
node --version

# If not, install Node.js 20 from https://nodejs.org
```

### Git push asks for credentials

If using HTTPS, you'll need a Personal Access Token:
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Use token as password when pushing

Or switch to SSH:
```bash
git remote set-url origin git@github.com:[YOUR-USERNAME]/meal-organizer-mvp.git
```

### GitHub Actions failing

- Make sure you added both Netlify secrets (NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID)
- Check the Actions tab for specific error messages
- Ensure Netlify site is created and connected to the repo

## What's Next?

Once setup is complete:

1. **View Sprint Board:** Check your Notion databases for Sprint 1 tasks
2. **Next Development Phase:** Backend Engineer will set up IndexedDB schema
3. **Monitor Progress:** Track tasks moving through To Do → In Progress → Done

## Need Help?

- Check GitHub Actions logs for CI/CD issues
- Check Netlify deploy logs for deployment issues
- Verify all secrets are correctly set in GitHub
