#!/bin/bash

# Meal Organizer MVP - GitHub Setup Script
# Run this script after creating a GitHub repository

echo "🚀 Meal Organizer MVP - GitHub Setup"
echo "===================================="
echo ""
echo "Before running this script:"
echo "1. Go to https://github.com/new"
echo "2. Create a new repository named: meal-organizer-mvp"
echo "3. Do NOT initialize with README, .gitignore, or license"
echo "4. Copy your repository URL"
echo ""
read -p "Enter your GitHub repository URL (e.g., https://github.com/username/meal-organizer-mvp.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ Error: Repository URL is required"
    exit 1
fi

echo ""
echo "📦 Setting up remote..."
git remote add origin "$REPO_URL"

echo "🔀 Creating develop branch..."
git checkout -b develop
git checkout main

echo "📤 Pushing to GitHub..."
git push -u origin main
git push -u origin develop

echo ""
echo "✅ Repository pushed successfully!"
echo ""
echo "Next steps:"
echo "1. Go to https://netlify.com and sign up/log in"
echo "2. Click 'Add new site' → 'Import an existing project'"
echo "3. Connect to your GitHub repository: meal-organizer-mvp"
echo "4. Netlify will auto-detect settings from netlify.toml"
echo "5. After deployment, get Site ID and Auth Token from Netlify settings"
echo "6. Add GitHub Secrets:"
echo "   - Go to: https://github.com/[your-username]/meal-organizer-mvp/settings/secrets/actions"
echo "   - Add NETLIFY_AUTH_TOKEN"
echo "   - Add NETLIFY_SITE_ID"
echo ""
echo "🎉 All done! Your CI/CD pipeline will run automatically on the next push."
