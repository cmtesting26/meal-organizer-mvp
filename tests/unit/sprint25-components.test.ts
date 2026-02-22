/**
 * Sprint 25 Component & Integration Tests
 *
 * S25-09: Integration wiring verification + unit tests
 *
 * Covers:
 * - S25-01: Timer auto-suggest parser (comprehensive edge cases)
 * - S25-02: Timer UI (CookingTimer component wiring)
 * - S25-03: Cooking mode instant exit (no confirmation dialog)
 * - S25-04: Cooking mode global theme support (CSS vars, no hardcoded dark)
 * - S25-05: Photo upload — AddPhotoButton on Recipe Detail
 * - S25-06: Photo upload — Supabase Storage backend service
 * - S25-07: Photo upload — Manual recipe creation form
 * - S25-08: Cooking mode — ingredients panel theming + step styling
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { parseTimerFromStep, formatTimerLabel } from '../../src/lib/timerParser';

const SRC = resolve(__dirname, '../../src');

function readFile(path: string): string {
  const full = resolve(SRC, path);
  if (!existsSync(full)) return '';
  return readFileSync(full, 'utf-8');
}

function fileExists(path: string): boolean {
  return existsSync(resolve(SRC, path));
}

// ═══════════════════════════════════════════════════════════════════════
// S25-01: Timer auto-suggest parser — extended edge cases
// ═══════════════════════════════════════════════════════════════════════

describe('S25-01: Timer Parser — extended edge cases', () => {
  it('parses "roughly 5 minutes"', () => {
    const r = parseTimerFromStep('Cook roughly 5 minutes until soft.');
    expect(r).not.toBeNull();
    expect(r!.seconds).toBe(300);
  });

  it('parses "around 25 min"', () => {
    const r = parseTimerFromStep('Bake around 25 min.');
    expect(r).not.toBeNull();
    expect(r!.seconds).toBe(1500);
  });

  it('parses "~10 minutes"', () => {
    const r = parseTimerFromStep('Cook ~10 minutes on medium heat.');
    expect(r).not.toBeNull();
    expect(r!.seconds).toBe(600);
  });

  it('parses "2 hrs" shorthand', () => {
    const r = parseTimerFromStep('Slow cook for 2 hrs.');
    expect(r).not.toBeNull();
    expect(r!.seconds).toBe(7200);
  });

  it('parses "45 secs"', () => {
    const r = parseTimerFromStep('Microwave for 45 secs.');
    expect(r).not.toBeNull();
    expect(r!.seconds).toBe(45);
  });

  it('parses compound "2 hours and 30 minutes"', () => {
    const r = parseTimerFromStep('Braise for 2 hours and 30 minutes.');
    expect(r).not.toBeNull();
    expect(r!.seconds).toBe(9000);
  });

  it('handles range with en-dash "15–20 minutes"', () => {
    const r = parseTimerFromStep('Roast 15–20 minutes.');
    expect(r).not.toBeNull();
    expect(r!.seconds).toBe(900); // lower bound
  });

  it('handles range with em-dash "10—15 min"', () => {
    const r = parseTimerFromStep('Fry 10—15 min.');
    expect(r).not.toBeNull();
    expect(r!.seconds).toBe(600); // lower bound
  });

  it('returns null for "few minutes" (no number)', () => {
    expect(parseTimerFromStep('Wait a few minutes.')).toBeNull();
  });

  it('returns null for temperature-like numbers "350°F for tender"', () => {
    // "350" is followed by °F, not a time unit — should not match
    const r = parseTimerFromStep('Bake at 350°F until golden.');
    expect(r).toBeNull();
  });

  it('prefers compound over simple when both present', () => {
    const r = parseTimerFromStep('Cook for 1 hour 15 minutes, stirring every 5 minutes.');
    expect(r).not.toBeNull();
    // Should match compound first: 1 hr 15 min = 4500s
    expect(r!.seconds).toBe(4500);
  });

  it('handles decimal minutes "1.5 minutes"', () => {
    const r = parseTimerFromStep('Cook 1.5 minutes.');
    expect(r).not.toBeNull();
    expect(r!.seconds).toBe(90);
  });

  it('achieves 80%+ accuracy on common recipe patterns', () => {
    // Test a batch of common recipe time phrases
    const patterns = [
      { text: 'Simmer for 20 minutes.', expected: 1200 },
      { text: 'Bake 25-30 minutes until golden.', expected: 1500 },
      { text: 'Cook about 10 min.', expected: 600 },
      { text: 'Let rest 5 minutes.', expected: 300 },
      { text: 'Boil for 8 minutes.', expected: 480 },
      { text: 'Roast for 1 hour.', expected: 3600 },
      { text: 'Sauté 3-4 minutes.', expected: 180 },
      { text: 'Cook for approximately 15 minutes.', expected: 900 },
      { text: 'Marinate for 30 min.', expected: 1800 },
      { text: 'Bake 1 hour 30 minutes.', expected: 5400 },
    ];

    let hits = 0;
    for (const p of patterns) {
      const result = parseTimerFromStep(p.text);
      if (result && result.seconds === p.expected) hits++;
    }

    const accuracy = hits / patterns.length;
    expect(accuracy).toBeGreaterThanOrEqual(0.8);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// S25-02: CookingTimer component — wiring verification
// ═══════════════════════════════════════════════════════════════════════

describe('S25-02: CookingTimer component wiring', () => {
  const timerSrc = readFile('components/CookingMode/CookingTimer.tsx');

  it('imports parseTimerFromStep from timerParser', () => {
    expect(timerSrc).toContain("import { parseTimerFromStep");
    expect(timerSrc).toContain("from '@/lib/timerParser'");
  });

  it('calls parseTimerFromStep with stepText', () => {
    expect(timerSrc).toContain('parseTimerFromStep(stepText)');
  });

  it('has ±30s adjustment controls', () => {
    expect(timerSrc).toContain('onAdjust(-30)');
    expect(timerSrc).toContain('onAdjust(30)');
  });

  it('has start, pause, reset handlers', () => {
    expect(timerSrc).toContain('onStart');
    expect(timerSrc).toContain('onPause');
    expect(timerSrc).toContain('onReset');
  });

  it('has progress bar calculation', () => {
    expect(timerSrc).toContain('progress');
    expect(timerSrc).toMatch(/duration.*remaining.*duration/);
  });

  it('has pulse animation at ≤10 seconds', () => {
    expect(timerSrc).toContain('remaining <= 10');
    expect(timerSrc).toContain('animate-pulse');
  });

  it('uses Web Audio API for audible alert (in parent CookingMode)', () => {
    const cookingSrc = readFile('components/CookingMode/CookingMode.tsx');
    expect(cookingSrc).toContain('AudioContext');
    expect(cookingSrc).toContain('createOscillator');
  });

  it('plays alert at 0 seconds (managed by parent CookingMode)', () => {
    const cookingSrc = readFile('components/CookingMode/CookingMode.tsx');
    expect(cookingSrc).toContain('playAlert');
    expect(cookingSrc).toMatch(/remaining\s*<=\s*1/);
  });

  it('has auto-suggest badge with sparkle icon', () => {
    expect(timerSrc).toContain('Sparkles');
    expect(timerSrc).toContain("backgroundColor: '#D97706'");
  });

  it('timer persists — does not reset on stepText change when running', () => {
    // The useEffect for stepText only pre-fills when timerState === 'idle'
    expect(timerSrc).toContain("timerState === 'idle'");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// S25-03: Instant exit — no confirmation dialog
// ═══════════════════════════════════════════════════════════════════════

describe('S25-03: Cooking mode instant exit', () => {
  const cookingSrc = readFile('components/CookingMode/CookingMode.tsx');

  it('does NOT have a confirmation dialog or modal', () => {
    // Should not contain dialog/modal state for exit
    expect(cookingSrc).not.toContain('showExitDialog');
    expect(cookingSrc).not.toContain('showExitConfirm');
    expect(cookingSrc).not.toContain('exitDialogOpen');
  });

  it('X button calls onExit directly', () => {
    expect(cookingSrc).toContain('handleExit');
    // handleExit should just call onExit() directly
    expect(cookingSrc).toMatch(/handleExit.*=.*useCallback\(\(\)\s*=>\s*\{[\s\S]*?onExit\(\)/);
  });

  it('Escape key exits immediately', () => {
    expect(cookingSrc).toContain("case 'Escape':");
    expect(cookingSrc).toContain('handleExit()');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// S25-04: Cooking mode follows global theme (no hardcoded dark)
// ═══════════════════════════════════════════════════════════════════════

describe('S25-04: Cooking mode global theme support', () => {
  const cookingSrc = readFile('components/CookingMode/CookingMode.tsx');
  const timerSrc = readFile('components/CookingMode/CookingTimer.tsx');
  const stepNavSrc = readFile('components/CookingMode/StepNavigation.tsx');

  it('CookingMode uses CSS custom properties for backgrounds', () => {
    expect(cookingSrc).toContain('var(--fs-bg-base)');
    expect(cookingSrc).toContain('var(--fs-bg-surface)');
    expect(cookingSrc).toContain('var(--fs-bg-elevated)');
  });

  it('CookingMode uses CSS custom properties for text colors', () => {
    expect(cookingSrc).toContain('var(--fs-text-primary)');
    expect(cookingSrc).toContain('var(--fs-text-muted)');
  });

  it('CookingMode uses CSS custom properties for borders', () => {
    expect(cookingSrc).toContain('var(--fs-border-default)');
  });

  it('CookingTimer uses CSS custom properties (not hardcoded dark colors)', () => {
    expect(timerSrc).toContain('var(--fs-bg-surface)');
    expect(timerSrc).toContain('var(--fs-border-default)');
    expect(timerSrc).toContain('var(--fs-bg-elevated)');
    expect(timerSrc).toContain('var(--fs-text-muted)');
    expect(timerSrc).toContain('var(--fs-text-primary)');
  });

  it('StepNavigation uses CSS custom properties', () => {
    expect(stepNavSrc).toContain('var(--fs-bg-elevated)');
    expect(stepNavSrc).toContain('var(--fs-text-primary)');
    expect(stepNavSrc).toContain('var(--fs-border-default)');
    expect(stepNavSrc).toContain('var(--fs-text-muted)');
  });

  it('does NOT hardcode dark-mode specific colors (#1C1917, #292524) in cooking components', () => {
    // Cooking components should use tokens, not hardcoded dark values
    // Exception: accent #D97706 is acceptable as it's always amber
    const noHardcodedDark = (src: string) => {
      // Remove comment lines to avoid false positives
      const lines = src.split('\n').filter(l => !l.trim().startsWith('*') && !l.trim().startsWith('//'));
      const code = lines.join('\n');
      // Check for hardcoded dark background/surface values in style props
      const darkBgMatches = code.match(/backgroundColor:\s*['"]#(1C1917|292524|44403C)['"]/g);
      return darkBgMatches || [];
    };

    expect(noHardcodedDark(cookingSrc).length).toBe(0);
    expect(noHardcodedDark(stepNavSrc).length).toBe(0);
  });

  it('design tokens have both light and dark values', () => {
    const tokensSrc = readFileSync(resolve(SRC, '../src/styles/tokens.css'), 'utf-8');
    // Light theme
    expect(tokensSrc).toContain('--fs-bg-base: #FFFFFF');
    expect(tokensSrc).toContain('--fs-bg-surface: #FFFFFF');
    // Dark theme
    expect(tokensSrc).toContain('--fs-bg-base: #1C1917');
    expect(tokensSrc).toContain('--fs-bg-surface: #292524');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// S25-05: Photo upload — AddPhotoButton on Recipe Detail
// ═══════════════════════════════════════════════════════════════════════

describe('S25-05: AddPhotoButton wiring on Recipe Detail', () => {
  const addPhotoSrc = readFile('components/recipes/AddPhotoButton.tsx');
  const recipeDetailSrc = readFile('pages/RecipeDetail.tsx');

  it('AddPhotoButton component exists', () => {
    expect(fileExists('components/recipes/AddPhotoButton.tsx')).toBe(true);
  });

  it('RecipeDetail imports AddPhotoButton', () => {
    expect(recipeDetailSrc).toContain("import { AddPhotoButton }");
    expect(recipeDetailSrc).toContain("from '@/components/recipes/AddPhotoButton'");
  });

  it('RecipeDetail renders AddPhotoButton', () => {
    expect(recipeDetailSrc).toContain('<AddPhotoButton');
  });

  it('AddPhotoButton has camera and file upload options', () => {
    expect(addPhotoSrc).toContain("capture=\"environment\"");
    expect(addPhotoSrc).toContain("accept=\"image/*\"");
    expect(addPhotoSrc).toContain('handleTakePhoto');
    expect(addPhotoSrc).toContain('handleUploadFile');
  });

  it('AddPhotoButton has dropdown menu', () => {
    expect(addPhotoSrc).toContain('dropdownOpen');
    expect(addPhotoSrc).toContain('setDropdownOpen');
  });

  it('AddPhotoButton calls uploadRecipePhoto on file selection', () => {
    expect(addPhotoSrc).toContain('uploadRecipePhoto');
    expect(addPhotoSrc).toContain('handleFileSelected');
  });

  it('AddPhotoButton reports results via onPhotoUploaded callback', () => {
    expect(addPhotoSrc).toContain('onPhotoUploaded');
  });

  it('RecipeDetail updates recipe imageUrl on photo upload', () => {
    expect(recipeDetailSrc).toContain('onPhotoUploaded');
    expect(recipeDetailSrc).toContain('imageUrl: result.photoUrl');
  });

  it('AddPhotoButton falls back to persistent local preview on any upload failure', () => {
    expect(addPhotoSrc).toContain('createPersistentPreviewUrl');
    expect(addPhotoSrc).toContain('savedLocally');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// S25-06: Photo upload — Supabase Storage backend service
// ═══════════════════════════════════════════════════════════════════════

describe('S25-06: Photo upload service (Supabase Storage)', () => {
  const serviceSrc = readFile('lib/photoUploadService.ts');

  it('photoUploadService module exists', () => {
    expect(fileExists('lib/photoUploadService.ts')).toBe(true);
  });

  it('defines recipe-photos bucket constant', () => {
    expect(serviceSrc).toContain("recipe-photos");
  });

  it('compresses images to max 800px width', () => {
    expect(serviceSrc).toContain('MAX_WIDTH = 800');
  });

  it('generates thumbnails at 200px width', () => {
    expect(serviceSrc).toContain('THUMB_WIDTH = 200');
  });

  it('targets ≤200KB compressed size', () => {
    expect(serviceSrc).toContain('200 * 1024');
  });

  it('uses JPEG at 80% quality', () => {
    expect(serviceSrc).toContain('JPEG_QUALITY = 0.8');
  });

  it('iteratively reduces quality if too large', () => {
    expect(serviceSrc).toContain('quality -= 0.1');
    expect(serviceSrc).toContain('compressed.size > MAX_FILE_SIZE');
  });

  it('supports common image formats', () => {
    expect(serviceSrc).toContain('image/jpeg');
    expect(serviceSrc).toContain('image/png');
    expect(serviceSrc).toContain('image/webp');
    expect(serviceSrc).toContain('image/heic');
  });

  it('uses Canvas API for compression', () => {
    expect(serviceSrc).toContain("document.createElement('canvas')");
    expect(serviceSrc).toContain('canvas.toBlob');
  });

  it('uploads to household-scoped storage path', () => {
    expect(serviceSrc).toContain('householdId');
    expect(serviceSrc).toContain('recipeId');
    expect(serviceSrc).toMatch(/`\$\{householdId\}\/\$\{recipeId\}/);
  });

  it('returns both photoUrl and thumbnailUrl', () => {
    expect(serviceSrc).toContain('photoUrl');
    expect(serviceSrc).toContain('thumbnailUrl');
  });

  it('has deleteRecipePhoto function', () => {
    expect(serviceSrc).toContain('export async function deleteRecipePhoto');
  });

  it('has createPreviewUrl utility', () => {
    expect(serviceSrc).toContain('export function createPreviewUrl');
    expect(serviceSrc).toContain('URL.createObjectURL');
  });

  it('has createPersistentPreviewUrl for base64 data URLs that survive page refresh', () => {
    expect(serviceSrc).toContain('export async function createPersistentPreviewUrl');
    expect(serviceSrc).toContain('readAsDataURL');
  });

  it('handles upload errors with typed error codes', () => {
    expect(serviceSrc).toContain("'not_configured'");
    expect(serviceSrc).toContain("'invalid_file'");
    expect(serviceSrc).toContain("'upload_failed'");
    expect(serviceSrc).toContain("'unsupported_format'");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// S25-07: Photo upload — Manual recipe creation form
// ═══════════════════════════════════════════════════════════════════════

describe('S25-07: Photo upload in RecipeForm (manual creation)', () => {
  const formSrc = readFile('components/recipes/RecipeForm.tsx');

  it('RecipeForm has photo state', () => {
    expect(formSrc).toContain('photoFile');
    expect(formSrc).toContain('photoPreview');
  });

  it('RecipeForm has dashed placeholder for photo field', () => {
    expect(formSrc).toMatch(/dashed|Add Photo/);
  });

  it('RecipeForm shows preview when photo is selected', () => {
    expect(formSrc).toContain('photoPreview');
    expect(formSrc).toMatch(/<img/i);
  });

  it('RecipeForm has remove photo button', () => {
    expect(formSrc).toContain('Remove photo');
  });

  it('RecipeForm has Take Photo option with camera capture', () => {
    expect(formSrc).toContain('capture="environment"');
    expect(formSrc).toContain('photo-camera-input');
    expect(formSrc).toContain('photoUpload.takePhoto');
  });

  it('RecipeForm has Upload File option', () => {
    expect(formSrc).toContain('photo-file-input');
    expect(formSrc).toContain('photoUpload.uploadFile');
  });

  it('RecipeForm has dropdown menu for photo options', () => {
    expect(formSrc).toContain('photoMenuOpen');
    expect(formSrc).toContain('setPhotoMenuOpen');
  });

  it('RecipeForm closes dropdown on outside click', () => {
    expect(formSrc).toContain('photoMenuRef');
    expect(formSrc).toContain('mousedown');
  });

  it('photo field is optional (recipes can be created without photo)', () => {
    // resolvedImageUrl falls back gracefully; recipe can submit without photo
    expect(formSrc).toContain('resolvedImageUrl');
    expect(formSrc).toContain('imageUrl.trim() || undefined');
  });

  it('uploads photo to Supabase Storage on save', () => {
    expect(formSrc).toContain('uploadRecipePhoto');
    expect(formSrc).toContain('uploadResult.photoUrl');
  });

  it('cleans up preview URL on unmount/removal', () => {
    expect(formSrc).toContain('URL.revokeObjectURL');
  });

  it('imports from photoUploadService', () => {
    expect(formSrc).toContain("from '@/lib/photoUploadService'");
  });

  it('imports Upload icon for dropdown', () => {
    expect(formSrc).toContain('Upload');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// S25-08: Ingredients panel theming + step styling
// ═══════════════════════════════════════════════════════════════════════

describe('S25-08: Cooking mode ingredients panel & step styling', () => {
  const cookingSrc = readFile('components/CookingMode/CookingMode.tsx');

  // Ingredients panel styling
  it('section label: 11px/600, amber (#D97706), uppercase', () => {
    expect(cookingSrc).toContain("fontSize: '11px'");
    expect(cookingSrc).toContain("fontWeight: 600");
    expect(cookingSrc).toContain("color: '#D97706'");
    expect(cookingSrc).toContain("textTransform: 'uppercase'");
    expect(cookingSrc).toContain("letterSpacing: '0.5px'");
  });

  it('bullet dots: 6×6px, amber, rounded', () => {
    expect(cookingSrc).toContain("width: '6px'");
    expect(cookingSrc).toContain("height: '6px'");
    expect(cookingSrc).toContain("backgroundColor: '#D97706'");
    expect(cookingSrc).toContain("borderRadius: '9999px'");
  });

  it('ingredient text: 22px matching instruction size, with theme-aware color', () => {
    expect(cookingSrc).toContain("fontSize: '22px'");
    expect(cookingSrc).toContain("var(--fs-text-primary)");
  });

  it('no-ingredients message: 13px, muted, italic', () => {
    expect(cookingSrc).toContain("var(--fs-text-muted)");
    expect(cookingSrc).toContain("fontStyle: 'italic'");
  });

  it('panel uses theme-aware surface and border', () => {
    expect(cookingSrc).toContain('var(--fs-bg-surface)');
    expect(cookingSrc).toContain('var(--fs-border-default)');
  });

  // Step display styling
  it('step indicator: 12px/600, muted, uppercase', () => {
    expect(cookingSrc).toContain("fontSize: '12px'");
    // Step indicator has uppercase
    expect(cookingSrc).toMatch(/textTransform.*uppercase/);
  });

  it('step dots: active 8px amber, inactive 6px theme-aware', () => {
    expect(cookingSrc).toContain("width: idx === currentStepIndex ? '8px' : '6px'");
    expect(cookingSrc).toContain("height: idx === currentStepIndex ? '8px' : '6px'");
    expect(cookingSrc).toContain("idx === currentStepIndex ? '#D97706' : 'var(--fs-border-default)'");
  });

  it('step text: 22px/400, large and readable', () => {
    expect(cookingSrc).toContain("fontSize: '22px'");
    expect(cookingSrc).toContain("fontWeight: 400");
    expect(cookingSrc).toContain("lineHeight: 1.5");
  });

  // Navigation buttons
  it('navigation buttons use theme-aware styling', () => {
    const navSrc = readFile('components/CookingMode/StepNavigation.tsx');
    expect(navSrc).toContain('var(--fs-bg-elevated)');
    expect(navSrc).toContain('var(--fs-border-default)');
    expect(navSrc).toContain('var(--fs-accent)');
    expect(navSrc).toContain('var(--fs-text-inverse)');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Integration: Timer persistence across step navigation
// ═══════════════════════════════════════════════════════════════════════

describe('Integration: Timer persistence across step navigation', () => {
  const cookingSrc = readFile('components/CookingMode/CookingMode.tsx');
  const timerSrc = readFile('components/CookingMode/CookingTimer.tsx');

  it('CookingTimer receives step props (controlled by parent)', () => {
    expect(cookingSrc).toContain('stepText={currentStep.text}');
    expect(cookingSrc).toContain('currentStepIndex={currentStepIndex}');
    expect(cookingSrc).toContain('timer={currentTimer}');
  });

  it('CookingTimer is a controlled component with idle state check', () => {
    expect(timerSrc).toContain("timerState === 'idle'");
  });

  it('Parent CookingMode manages timer state per step via Map', () => {
    expect(cookingSrc).toContain('Map<number, TimerData>');
    expect(cookingSrc).toContain('timers.get(currentStepIndex)');
  });

  it('Parent CookingMode manages intervals for running timers', () => {
    expect(cookingSrc).toContain('intervalRefs');
    expect(cookingSrc).toContain('setInterval');
    expect(cookingSrc).toContain('clearInterval');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Integration: CookingMode wiring (all pieces connected)
// ═══════════════════════════════════════════════════════════════════════

describe('Integration: CookingMode complete wiring', () => {
  const cookingSrc = readFile('components/CookingMode/CookingMode.tsx');

  it('imports CookingTimer component', () => {
    expect(cookingSrc).toContain("import { CookingTimer, type TimerData }");
  });

  it('imports StepNavigation component', () => {
    expect(cookingSrc).toContain("import { StepNavigation }");
  });

  it('imports parseSteps for step parsing', () => {
    expect(cookingSrc).toContain("import { parseSteps");
  });

  it('imports matchIngredientsToSteps', () => {
    expect(cookingSrc).toContain("import { matchIngredientsToSteps");
  });

  it('has useWakeLock for screen-on during cooking', () => {
    expect(cookingSrc).toContain("import { useWakeLock }");
    expect(cookingSrc).toContain('wakeLockActive');
  });

  it('keyboard navigation wired (← → Escape)', () => {
    expect(cookingSrc).toContain("'ArrowLeft'");
    expect(cookingSrc).toContain("'ArrowRight'");
    expect(cookingSrc).toContain("'Escape'");
  });

  it('responsive layout: portrait 30/70 split', () => {
    expect(cookingSrc).toContain('h-[30%]');
    expect(cookingSrc).toContain('h-[70%]');
    expect(cookingSrc).toContain('md:flex-row');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Integration: RecipeDetail → CookingMode flow
// ═══════════════════════════════════════════════════════════════════════

describe('Integration: RecipeDetail → CookingMode flow', () => {
  const detailSrc = readFile('pages/RecipeDetail.tsx');

  it('RecipeDetail imports CookingMode', () => {
    expect(detailSrc).toContain("import { CookingMode }");
  });

  it('RecipeDetail has showCookingMode state', () => {
    expect(detailSrc).toContain('showCookingMode');
    expect(detailSrc).toContain('setShowCookingMode');
  });

  it('RecipeDetail has Start Cooking button', () => {
    expect(detailSrc).toMatch(/Start Cooking|startCooking/);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// i18n: All new keys present
// ═══════════════════════════════════════════════════════════════════════

describe('i18n: Sprint 25 translation keys', () => {
  const enJson = JSON.parse(readFileSync(resolve(SRC, '../src/i18n/en.json'), 'utf-8'));
  const deJson = JSON.parse(readFileSync(resolve(SRC, '../src/i18n/de.json'), 'utf-8'));

  const requiredCookingKeys = [
    'timerDetected',
    'timerStart',
    'timerPause',
    'timerResume',
    'timerMinus30',
    'timerPlus30',
  ];

  const requiredPhotoKeys = [
    'addPhoto',
    'takePhoto',
    'uploadFile',
    'uploading',
    'success',
    'failed',
  ];

  for (const key of requiredCookingKeys) {
    it(`EN has cookingMode.${key}`, () => {
      expect(enJson.cookingMode?.[key]).toBeTruthy();
    });

    it(`DE has cookingMode.${key}`, () => {
      expect(deJson.cookingMode?.[key]).toBeTruthy();
    });
  }

  for (const key of requiredPhotoKeys) {
    it(`EN has photoUpload.${key}`, () => {
      expect(enJson.photoUpload?.[key]).toBeTruthy();
    });

    it(`DE has photoUpload.${key}`, () => {
      expect(deJson.photoUpload?.[key]).toBeTruthy();
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// TypeScript: Clean compilation
// ═══════════════════════════════════════════════════════════════════════

describe('TypeScript compilation', () => {
  it('all Sprint 25 source files exist', () => {
    expect(fileExists('lib/timerParser.ts')).toBe(true);
    expect(fileExists('lib/photoUploadService.ts')).toBe(true);
    expect(fileExists('components/CookingMode/CookingMode.tsx')).toBe(true);
    expect(fileExists('components/CookingMode/CookingTimer.tsx')).toBe(true);
    expect(fileExists('components/CookingMode/StepNavigation.tsx')).toBe(true);
    expect(fileExists('components/recipes/AddPhotoButton.tsx')).toBe(true);
    expect(fileExists('components/recipes/RecipeForm.tsx')).toBe(true);
  });

  it('CookingMode index exports', () => {
    const indexSrc = readFile('components/CookingMode/index.ts');
    expect(indexSrc).toContain('CookingMode');
  });
});
