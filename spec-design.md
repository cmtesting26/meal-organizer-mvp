# Fork & Spoon — Exact Design Spec for Pencil

> **Purpose**: This file maps every component's code properties to exact Pencil values.
> Always read this file AND the source `.tsx` file before creating/updating any Pencil component.

## Golden Rules

1. **Always read the `.tsx` source** before touching a Pencil component
2. **Never approximate** — extract every value from code (colors, sizes, spacing, fonts)
3. **Use CSS variables** (`$fs-*`) in Pencil wherever the code uses `var(--fs-*)`
4. **Calculate CSS math** — e.g. flexbox centering with negative margins (see FAB example)
5. **Verify with screenshots** after every batch of changes

---

## Tailwind → Pixel Reference

### Spacing (padding, margin, gap)
| Class | Value | | Class | Value |
|-------|-------|-|-------|-------|
| `p-0.5` / `gap-0.5` | 2px | | `p-4` / `gap-4` | 16px |
| `p-1` / `gap-1` | 4px | | `p-5` / `gap-5` | 20px |
| `p-1.5` / `gap-1.5` | 6px | | `p-6` / `gap-6` | 24px |
| `p-2` / `gap-2` | 8px | | `p-8` / `gap-8` | 32px |
| `p-3` / `gap-3` | 12px | | `p-10` / `gap-10` | 40px |

### Heights / Widths
| Class | Value | | Class | Value |
|-------|-------|-|-------|-------|
| `h-2.5` / `w-2.5` | 10px | | `h-9` / `w-9` | 36px |
| `h-3.5` / `w-3.5` | 14px | | `h-10` / `w-10` | 40px |
| `h-4` / `w-4` | 16px | | `h-12` / `w-12` | 48px |
| `h-5` / `w-5` | 20px | | `h-14` | 56px |
| `h-6` / `w-6` | 24px | | `h-40` | 160px |
| `h-8` / `w-8` | 32px | | `h-48` | 192px |
| `w-16` | 64px | | `h-56` | 224px |

### Font Sizes
| Class | Value | | Class | Value |
|-------|-------|-|-------|-------|
| `text-[11px]` | 11px | | `text-base` | 16px |
| `text-xs` | 12px | | `text-lg` | 18px |
| `text-sm` | 14px | | `text-xl` | 20px |

### Border Radius (--radius: 0.5rem = 8px)
| Class | Value |
|-------|-------|
| `rounded-sm` | 4px |
| `rounded-md` | 6px |
| `rounded` | 4px (default) |
| `rounded-lg` | 8px |
| `rounded-xl` | 12px |
| `rounded-2xl` | 16px |
| `rounded-full` | 9999px |

### Font Weights
| Class | Value | | Class | Value |
|-------|-------|-|-------|-------|
| `font-normal` | 400 | | `font-semibold` | 600 |
| `font-medium` | 500 | | `font-bold` | 700 |

---

## Color System (Light Theme)

### Backgrounds
| Token | Hex | Usage |
|-------|-----|-------|
| `--fs-bg-base` | `#FFFFFF` | Page background |
| `--fs-bg-surface` | `#FFFFFF` | Card surfaces |
| `--fs-bg-elevated` | `#F5F5F4` | Elevated areas (Stone 100) |
| `--fs-bg-sunken` | `#FAFAF9` | Sunken areas (Stone 50) |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `--fs-text-primary` | `#1C1917` | Main text (Stone 900) |
| `--fs-text-secondary` | `#44403C` | Secondary text (Stone 700) |
| `--fs-text-muted` | `#78716C` | Muted text (Stone 500) |
| `--fs-text-placeholder` | `#A8A29E` | Placeholder (Stone 400) |

### Accent (Amber Brand)
| Token | Hex | Usage |
|-------|-----|-------|
| `--fs-accent` | `#D97706` | Primary accent (Amber 600) |
| `--fs-accent-hover` | `#B45309` | Hover state (Amber 700) |
| `--fs-accent-light` | `#FEF3C7` | Light amber bg (Amber 100) |
| `--fs-accent-muted` | `#FDE68A` | Muted amber (Amber 200) |
| `--fs-accent-text` | `#92400E` | Text on light bg (Amber 800) |

### Borders
| Token | Hex | Usage |
|-------|-----|-------|
| `--fs-border-default` | `#E7E5E4` | Default borders (Stone 200) |
| `--fs-border-muted` | `#F5F5F4` | Subtle borders (Stone 100) |
| `--fs-border-strong` | `#D6D3D1` | Strong borders (Stone 300) |
| `--fs-border-accent` | `#D97706` | Accent borders (Amber 600) |

### Navigation
| Token | Hex | Usage |
|-------|-----|-------|
| `--fs-nav-bg` | `#FFFFFF` | Nav background |
| `--fs-nav-border` | `#E7E5E4` | Nav top border |
| `--fs-nav-text` | `#78716C` | Inactive tab text |
| `--fs-nav-text-active` | `#D97706` | Active tab text |

### Warm Header
| Token | Hex | Usage |
|-------|-----|-------|
| `--fs-warm-header-bg` | `#FFFBEB` | Header background (Amber 50) |
| `--fs-warm-header-border` | `#FDE68A` | Header bottom border (Amber 200) |
| `--fs-warm-header-btn-bg` | `#FFFFFF` | Button background |
| `--fs-warm-header-btn-border` | `#E7E5E4` | Button border (Stone 200) |

### Cards
| Token | Hex |
|-------|-----|
| `--fs-card-bg` | `#FFFFFF` |
| `--fs-card-border` | `#E7E5E4` |

### shadcn/ui (HSL → Hex in Light Mode)
| Token | HSL | Hex |
|-------|-----|-----|
| `--foreground` | `0 0% 3.9%` | `#0A0A0A` |
| `--background` | `0 0% 100%` | `#FFFFFF` |
| `--input` | `0 0% 89.8%` | `#E5E5E5` |
| `--border` | `0 0% 89.8%` | `#E5E5E5` |

### Tailwind Gray Scale (used in some components)
| Class | Hex |
|-------|-----|
| `text-gray-300` / `gray-300` | `#D1D5DB` |
| `text-gray-400` / `gray-400` | `#9CA3AF` |
| `text-gray-500` / `gray-500` | `#6B7280` |
| `text-gray-700` / `gray-700` | `#374151` |
| `text-gray-900` / `gray-900` | `#111827` |
| `bg-gray-100` | `#F3F4F6` |
| `bg-gray-50` | `#F9FAFB` |
| `divide-gray-100` | `#F3F4F6` |

### Recency Badge Colors (Light)
| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| Green (≤7d) | `#DCFCE7` | `#16A34A` | `#BBF7D0` |
| Yellow (8-21d) | `#FEF9C3` | `#CA8A04` | `#FDE68A` |
| Red (≥22d) | `#FEE2E2` | `#DC2626` | `#FECACA` |
| Gray (never) | `#F5F5F4` | `#78716C` | `#E7E5E4` |

---

## Typography

| Font | Usage | Pencil `fontFamily` |
|------|-------|---------------------|
| **Fraunces** | Headlines, screen titles | `Fraunces` |
| **DM Sans** | Body text, labels, buttons | `DM Sans` |

---

## Component Specs

### BottomNav (`src/components/layout/BottomNav.tsx`)

**Outer nav:**
- Position: fixed bottom, z-50
- Background: `$fs-nav-bg` (#FFFFFF)
- Border top: 1px solid `$fs-nav-border` (#E7E5E4)
- paddingBottom: env(safe-area-inset-bottom)

**Inner container:**
- Layout: `flex items-center justify-around`
- Height: 56px (`h-14`)
- Padding: 0 24px (`px-6`)

**NavItem (Schedule / Library tabs):**
- Layout: flex column, `items-center justify-center`
- Gap: 2px (`gap-0.5`)
- Min size: 44x44px
- Icon: 24x24px (`w-6 h-6`)
- Label: 11px (`text-[11px]`), fontFamily: DM Sans
- Active: color `#D97706`, fontWeight 600
- Inactive: color `#78716C` (`var(--fs-nav-text)`), fontWeight 500

**FAB (center button):**
- Wrapper: `flex items-center justify-center`, margin-top: -40px (`-mt-10`)
- Button: 60x60px, cornerRadius 30 (rounded-full)
- Background: `#D97706` (bg-amber-600)
- Shadow: `shadow-lg shadow-amber-600/30` → blur 12, color `#D9770640`, offset y=4
- Plus icon: 32x32px (`w-8 h-8`), color white, strokeWidth 2.5

**Pencil layout note (layout: "none"):**
Since Pencil doesn't support negative margins in flex, use `layout: "none"` and position manually:
- Nav height: 56px, clip: false
- Calculate positions with `justify-around` in 390px width, px-6 (24px sides):
  - Content width = 342px, divided into 3 zones of 114px
  - ScheduleTab center: 24 + 57 = 81 → x = 81 - (itemWidth/2)
  - FAB center: 24 + 171 = 195 → x = 195 - 30 = 165
  - LibraryTab center: 24 + 285 = 309 → x = 309 - (itemWidth/2)
- Tab y: (56 - tabHeight) / 2 ≈ 9
- FAB y: Flexbox with -mt-10 → content top = (56 - 20) / 2 - 40 = **-22**
  - Calculation: outerSize = -40 + 60 = 20; centerY = (56-20)/2 = 18; contentTop = 18 - 40 = -22

### WarmHeader (`src/components/common/WarmHeader.tsx`)

- Position: sticky top-0, z-40
- Background: `$fs-warm-header-bg` (#FFFBEB)
- Border bottom: 1px solid `$fs-warm-header-border` (#FDE68A)
- Padding: 12px 16px (`px-4 py-3`)

**Title row:**
- Layout: flex, justify-between, items-center
- Left group gap: 10px (`gap-2.5`)
- Icon color: `#D97706`
- Title font: Fraunces, 22px (normal) / 20px (backButton variant), weight 700
- Title color: `$fs-text-primary` (#1C1917)

**Back button:**
- Size: 36x36px
- Background: `$fs-warm-header-btn-bg` (#FFFFFF)
- Border: 1px solid `$fs-warm-header-btn-border` (#E7E5E4)
- Border radius: 8px
- Shadow: 0 1px 2px rgba(0,0,0,0.04)
- ArrowLeft icon: 20x20px, color `$fs-text-muted` (#78716C)

**Right action button (settings gear):**
- Size: 36x36px (`w-9 h-9`)
- Same styling as back button
- Settings icon: 20x20px, color `$fs-text-muted`

**Children slot:** margin-top 8px (`mt-2`)

### DayCard (`src/components/schedule/DayCard.tsx`)

- Border radius: 16px (uses shadcn Card which has rounded-lg, but screenshots show 16px)
- Background: `#FFFFFF`
- Border: 1px solid `#E7E5E4`
- Shadow: 0 1px 3px rgba(0,0,0,0.04)
- Padding: 16px (`p-4`)

**Today variant:**
- Border: 2px solid `#D97706`
- Background: `#FFFBEB`

**Past day variant:**
- Opacity: 50%

**Day header:**
- Layout: flex, items-center, gap 8px, margin-bottom 8px
- Date text: 14px, fontWeight 600, color `#1C1917` (today: `#D97706`)

**Today badge:**
- Font: 12px, fontWeight 500
- Padding: 2px 6px, rounded-full
- Background: `#D97706`, color: `#FFFFFF`

**Meal slots divider:** 1px solid `#F3F4F6` (divide-gray-100)

### MealSlot (`src/components/schedule/MealSlot.tsx`)

**Container:**
- Layout: flex, items-center, justify-between
- Min height: 44px
- Padding: 8px 0 (`py-2`)

**Meal label:**
- Font: 14px (`text-sm`), color `#6B7280` (`text-gray-500`)
- Width: 64px (`w-16`), shrink-0

**Empty slot — Add button (shadcn outline variant):**
- Height: 32px (`h-8`)
- Font: 12px (`text-xs`)
- Background: `#FFFFFF` (`bg-background`)
- Border: 1px solid `#E5E5E5` (`border-input`)
- Shadow: 0 1px 2px rgba(0,0,0,0.05) (`shadow-sm`)
- Text color: `#0A0A0A` (`--foreground`)
- Border radius: 6px (`rounded-md`)
- Padding: 0 12px (`px-3`)

**Filled slot:**
- Grip handle: 16x16px, color `#D1D5DB` (gray-300)
- Thumbnail: 32x32px, rounded 4px, bg `#F3F4F6`
- Title: 14px, fontWeight 500, color `#111827` (gray-900)
- Remove X button: 24x24px, icon 14x14px, color `#9CA3AF` (gray-400)

### WeekNavigation (`src/components/schedule/WeekNavigation.tsx`)

- Layout: flex, items-center, justify-between
- Chevron buttons: ghost variant, size sm
- Chevron icons: 16x16px
- Week label: 14px, fontWeight 500, color `#374151` (gray-700)

### RecipeCard (`src/components/recipes/RecipeCard.tsx`)

- Layout: flex row, items-center, gap 12px
- Padding: 12px (`p-3`)
- Border radius: 12px (`rounded-xl`)
- Background: `$fs-card-bg` (#FFFFFF)
- Border: 1px solid `$fs-card-border` (#E7E5E4)
- Transition: 150ms

**Thumbnail:** 56x56px, rounded-lg (8px), bg `$fs-bg-elevated`
**Title:** 14px, fontWeight 600, color `$fs-text-primary`, truncate
**Tags:** gap 6px, mt 4px, flex-wrap
**Tag badge:** 11px, fontWeight 500, padding 4px 8px, rounded-full
  - bg `$fs-bg-elevated`, color `$fs-text-secondary`, border `$fs-border-default`
**Cook count badge:** 11px, fontWeight 600, padding 4px 8px, rounded-full
  - bg `$fs-accent-light` (#FEF3C7), color `$fs-accent-text` (#92400E)
  - Flame icon: 10x10px

### TextTabs (`src/components/common/TextTabs.tsx`)

- Container: flex, gap 24px
- Container border-bottom: 1px solid `$fs-border-default` (#E7E5E4)
- Tab font: DM Sans, 14px
- Tab padding: 8px 0
- Active: fontWeight 600, color `$fs-text-primary` (#1C1917), border-bottom 2px solid `#D97706`, marginBottom -1px
- Inactive: fontWeight 400, color `$fs-text-muted` (#78716C), border-bottom 2px solid transparent

### OptionButton (`src/components/common/OptionButton.tsx`)

- Container: flex, gap 8px
- Each button: flex 1, padding 8px 12px, borderRadius 8px, fontSize 13px, DM Sans
- Active: bg `#FEF3C7`, color `#92400E`, border 1px solid `#D97706`, fontWeight 600
- Inactive: bg `#F5F5F4`, color `#57534E`, border 1px solid `#D6D3D1`, fontWeight 400

### RecencyBadge (`src/components/common/RecencyBadge.tsx`)

- Display: inline-flex, items-center
- Padding: 2px 8px (`py-0.5 px-2`)
- Border: 1px solid, rounded-full
- Font: 11px, fontWeight 600

### CookFrequency (`src/components/recipes/CookFrequency.tsx`)

- Layout: flex, items-center, gap 6px
- Font: 14px, color `$fs-accent-text` (#92400E)
- Flame icon: 16x16px, color `$fs-accent` (#D97706)

### ServingSelector (`src/components/recipes/ServingSelector.tsx`)

- Layout: flex row, items-center, gap 8px
- Label: 12px, color `#6B7280` (gray-500)
- Stepper: inline-flex, rounded-lg (8px), 1px border, bg white
- +/- buttons: padding 6px, icon 14x14px, color `#6B7280`
- Value: 14px, fontWeight 600, min-width 40px, text-center
- Value color: `#111827` (normal) / `#15803D` (scaled)

### SyncStatusBadge (`src/components/common/SyncStatusBadge.tsx`)

- Layout: flex, items-center, gap 6px
- Font: 12px, color `#6B7280` (gray-500)
- Status dot: 10x10px (`h-2.5 w-2.5`), rounded-full
  - Synced: `#22C55E` (green-500)
  - Syncing: `#F59E0B` (amber-500), with ping animation
  - Offline: `#9CA3AF` (gray-400)
  - Error: `#EF4444` (red-500)
- Icon: 20x20px (`w-5 h-5`)
- Queue badge: bg `#FEF3C7` (amber-100), color `#B45309` (amber-700), 10px, rounded-full

### RecipeDetail (`src/pages/RecipeDetail.tsx`)

**Hero image:** height 224px (`h-56`), rounded-xl (12px), overflow hidden
**Tags:** flex, gap 6px, mb 12px
**Stats row:** flex, gap 12px, mb 16px
**Pinned button:**
- Background: `#D97706`, color white
- Padding: 14px, borderRadius 12px
- Font: 15px, fontWeight 700
- Shadow: 0 4px 12px rgba(217,119,6,0.3)
- Gap: 8px, with Play icon

**Ingredient list (bullet style):**
- Each item: flex row, gap 8px
- Bullet: "•" character
- Quantity: fontWeight 700 (bold)
- Text: 14px, color `$fs-text-primary`

**Instruction steps:**
- Step number: 24x24px circle, bg `#FEF3C7`, color `#92400E`, 12px bold
- Text: 14px, line-height 1.625

### Settings (`src/pages/Settings.tsx`)

**Section card:**
- Border radius: 12px, padding 16px
- Background: `$fs-card-bg`, border: `$fs-card-border`
- Shadow: 0 1px 3px rgba(0,0,0,0.04)
- Margin bottom: 12px

**Section header:** flex, gap 12px, mb 12px
- Icon: 20x20px, color `$fs-text-muted`
- Title: 14px, fontWeight 500, color `$fs-text-primary`

**Link buttons:** padding 12px, rounded-xl, border 1px solid

---

## Pencil-Specific Notes

### Layout Limitations
- **Negative margins**: Don't work in Pencil flex layouts. Use `layout: "none"` + manual x/y
- **position: absolute**: Not supported inside flex containers
- **flexWrap: "wrap"**: Not supported. Use multiple rows instead
- **layout: null**: Doesn't work. Use `layout: "none"` to disable auto-layout

### Variable Mapping
Use Pencil variables (`$fs-*`) wherever code uses `var(--fs-*)`:
- `var(--fs-nav-bg)` → `$fs-nav-bg`
- `var(--fs-accent)` → `$fs-accent`
- etc.

### Icon Names (Lucide)
Some Lucide icon names differ in Pencil:
- `MoreVertical` → `ellipsis-vertical`
- `Clock` → `clock-3`
- `HelpCircle` → `life-buoy`
- All others: use kebab-case of the Lucide name
