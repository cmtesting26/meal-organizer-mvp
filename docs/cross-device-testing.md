# Cross-Device Testing Checklist — V1.3

*Sprint 14 — S14-12 · 2026-02-14*

## Devices & Browsers to Test

- [ ] Chrome Desktop (Windows/Mac)
- [ ] Safari Desktop (Mac)
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Firefox Desktop

## Test Scenarios

### 1. Recipe Library (all devices)
- [ ] Recipes display with blue tag badges and green recency badges
- [ ] Search bar has rounded-xl styling (no white box)
- [ ] Recipe titles truncate on single line
- [ ] No chef hat icon visible on recipe cards
- [ ] Tag filter chips are blue when selected

### 2. Recipe Detail (all devices)
- [ ] Tags display in blue
- [ ] Instructions header has no chef hat icon
- [ ] Quick-log button works from detail page
- [ ] Serving selector adjusts ingredient quantities
- [ ] Share button generates public link (when authenticated)

### 3. Import Flows (all devices)
- [ ] URL import: paste + extract recipe
- [ ] Social media: Instagram URL auto-detected
- [ ] "Import from Photo" button visible
- [ ] Camera capture works on mobile
- [ ] File upload works on desktop
- [ ] Claude Vision extracts recipe correctly
- [ ] Review form allows editing before save

### 4. Cloud Sync (two devices)
- [ ] Recipe added on Device A appears on Device B within 5s
- [ ] Offline edits queue and sync on reconnect
- [ ] Sync status badge updates correctly
- [ ] Household invite code works for second user

### 5. Data Safety (any device)
- [ ] Export creates valid JSON backup
- [ ] Import restores from backup correctly
- [ ] Paprika format imports successfully
- [ ] Recipe Keeper format imports successfully

### 6. PWA (mobile)
- [ ] App installable from browser prompt
- [ ] Works offline after install
- [ ] Update prompt appears when new version available

## Known Limitations
- Camera access requires HTTPS (localhost works for dev)
- Tesseract.js first-run downloads ~15MB language data
- Claude Vision requires API access (falls back to Tesseract gracefully)
