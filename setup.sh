#!/bin/bash

# Meal Organizer MVP - Quick Setup Script
# This installs all shadcn/ui components needed

echo "🚀 Setting up Meal Organizer MVP..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
    echo "✅ Dependencies installed!"
    echo ""
else
    echo "📦 node_modules exists, checking for missing packages..."
    npm install tailwindcss-animate --save-dev
    echo "✅ Dependencies verified!"
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "✅ .env created! Remember to add your CORS proxy URL later."
    echo ""
fi

# Initialize shadcn/ui
echo "🎨 Initializing shadcn/ui..."
echo "   When prompted, choose:"
echo "   - Style: Default"
echo "   - Base color: Slate"
echo "   - CSS variables: Yes"
echo "   - Tailwind config: Yes"
echo "   - Import alias: @/*"
echo ""
npx shadcn-ui@latest init --yes --defaults

# Install all required components
echo ""
echo "📦 Installing UI components..."
components=("sheet" "dialog" "button" "input" "textarea" "label" "alert" "card" "badge")

for component in "${components[@]}"; do
    echo "   Installing $component..."
    npx shadcn-ui@latest add $component --yes --overwrite
done

echo ""
echo "✅ All components installed!"
echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "Then visit: http://localhost:5173"
echo ""
