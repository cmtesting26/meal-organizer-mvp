# 🚨 IMMEDIATE FIX - 3 Quick Commands

You're seeing errors because of 3 missing pieces. Here's the fix:

## ✅ Run These 3 Commands (2 minutes)

```bash
# 1. Install missing dependency
npm install tailwindcss-animate --save-dev

# 2. Rename the JSX file
mv src/hooks/useToast.ts src/hooks/useToast.tsx

# 3. Install UI components
npx shadcn-ui@latest add sheet dialog button input textarea label alert card badge --yes --overwrite
```

Then:
```bash
npm run dev
```

**Done!** Visit http://localhost:5173 ✅

---

## What Each Command Does

### 1. `npm install tailwindcss-animate --save-dev`
Installs the missing Tailwind animation plugin that the config requires.

### 2. `mv src/hooks/useToast.ts src/hooks/useToast.tsx`
Renames the file to `.tsx` because it contains JSX code (React components).

### 3. `npx shadcn-ui@latest add ...`
Installs all the UI components (button, card, dialog, etc.) into `src/components/ui/`.

---

## Alternative: Full Reset

If you want to start fresh:

```bash
# Delete everything
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Fix the file extension
mv src/hooks/useToast.ts src/hooks/useToast.tsx

# Install UI components
npx shadcn-ui@latest init --yes --defaults
npx shadcn-ui@latest add sheet dialog button input textarea label alert card badge --yes --overwrite

# Run
npm run dev
```

---

## Why These Errors?

### Error 1: `useToast.ts:71:9: ERROR: Expected ">" but found "className"`
- **Cause**: File has `.ts` extension but contains JSX
- **Fix**: Rename to `.tsx`

### Error 2: `Cannot find module 'tailwindcss-animate'`
- **Cause**: Missing npm package
- **Fix**: Install it

### Error 3: `Failed to resolve import "@/components/ui/button"`
- **Cause**: shadcn/ui components not installed
- **Fix**: Run `npx shadcn-ui add ...`

---

## After the Fix

You should see:
- ✅ No errors in terminal
- ✅ Server running at http://localhost:5173
- ✅ App loads in browser
- ✅ 5 recipe cards visible
- ✅ "Add Recipe" button works

---

## Still Not Working?

Try this nuclear option:

```bash
# 1. Clean everything
rm -rf node_modules package-lock.json .next .vite

# 2. Fresh install
npm install

# 3. Fix file extension
mv src/hooks/useToast.ts src/hooks/useToast.tsx 2>/dev/null || echo "Already renamed"

# 4. Install UI components
npx shadcn-ui@latest init --yes --defaults
npx shadcn-ui@latest add sheet dialog button input textarea label alert card badge --yes --overwrite

# 5. Run
npm run dev
```

---

**These 3 commands will fix everything!** 🚀

After running them, you'll have a fully working app.
