# 🔧 QUICK FIX - Missing UI Components

## The Error You're Seeing

```
Failed to resolve import "@/components/ui/dialog"
Failed to resolve import "@/components/ui/card"
Failed to resolve import "@/components/ui/button"
```

This happens because **shadcn/ui components need to be installed first**!

---

## ✅ Quick Fix (3 Options)

### Option 1: Use Setup Script (EASIEST! ⭐)

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

**Windows:**
```bash
setup.bat
```

This installs everything automatically!

---

### Option 2: Manual Install (Step-by-Step)

```bash
# 1. Install dependencies
npm install

# 2. Create .env
cp .env.example .env

# 3. Initialize shadcn/ui
npx shadcn-ui@latest init

# When prompted, choose:
# - Style: Default (press Enter)
# - Base color: Slate (press Enter)  
# - CSS variables: Yes (press Enter)
# - Tailwind config: Yes (press Enter)
# - Import alias: @/* (press Enter)

# 4. Install all components (one command!)
npx shadcn-ui@latest add sheet dialog button input textarea label alert card badge

# 5. Run!
npm run dev
```

---

### Option 3: Install Components One-by-One

If the batch command doesn't work, install one at a time:

```bash
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add label
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
```

---

## Why This Happens

shadcn/ui is a component library that **copies components into your project** rather than installing them as npm packages. This gives you full control over the components, but they need to be added to your `src/components/ui` folder first.

When you run `npx shadcn-ui@latest add [component]`, it:
1. Creates the component file in `src/components/ui/`
2. Adds any required dependencies
3. Sets up proper imports

---

## After Installing Components

Run the dev server:
```bash
npm run dev
```

Visit http://localhost:5173 - should work now! ✅

---

## What Gets Installed

The setup creates these files in `src/components/ui/`:
- `sheet.tsx` - Import modal
- `dialog.tsx` - Recipe form modal
- `button.tsx` - All buttons
- `input.tsx` - Text inputs
- `textarea.tsx` - Multi-line inputs
- `label.tsx` - Form labels
- `alert.tsx` - Error messages
- `card.tsx` - Recipe cards
- `badge.tsx` - Recency badges

Plus supporting files:
- `src/lib/utils.ts` (already exists)
- Updates to `tailwind.config.js` (already configured)
- CSS variables in `src/index.css` (already configured)

---

## Troubleshooting

### "npx: command not found"
- Update npm: `npm install -g npm@latest`
- Or install via Node.js: https://nodejs.org

### "EACCES: permission denied"
- Mac/Linux: Use `sudo npm install -g npx`
- Windows: Run terminal as Administrator

### Components install but still get errors
1. Stop dev server (Ctrl+C)
2. Delete `.next` or `.vite` cache folders
3. Run `npm run dev` again

### Still not working?
- Check Node version: `node --version` (needs 18+)
- Clear cache: `npm cache clean --force`
- Delete and reinstall: `rm -rf node_modules package-lock.json && npm install`

---

## Quick Reference

**Easiest way:**
```bash
./setup.sh          # Mac/Linux
setup.bat           # Windows
```

**Manual way:**
```bash
npm install
npx shadcn-ui@latest init
npx shadcn-ui@latest add sheet dialog button input textarea label alert card badge
npm run dev
```

---

**After this one-time setup, everything will work!** 🚀

The setup takes about 2-3 minutes and you only need to do it once.
