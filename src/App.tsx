/**
 * Main App Component (Sprint 9)
 *
 * Sprint 9 changes:
 * - AuthProvider wraps entire app
 * - AuthFlow screen for login/register/household setup
 * - "Continue without account" keeps local-only mode
 * - Account section in Settings for logged-in users
 */

import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RecipeLibrary } from './components/recipes/RecipeLibrary';
import { ImportSheet } from './components/recipes/ImportSheet';
import { RecipeForm } from './components/recipes/RecipeForm';
import { WeeklySchedule } from './components/schedule/WeeklySchedule';
import { BottomNav } from './components/layout/BottomNav';
import { AddRecipeSheet } from './components/recipes/AddRecipeSheet';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SkeletonLoader } from './components/common/LoadingSpinner';
import { ToastContainer, useToast } from './hooks/useToast';
import { useRecipes } from './hooks/useRecipes';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { SyncProvider } from './hooks/useSyncProvider';
import { useNewRecipes } from './hooks/useNewRecipes';
import { SyncStatusBadge } from './components/common/SyncStatusBadge';
import { AuthFlow } from './components/auth/AuthFlow';
import { isSupabaseConfigured } from './lib/supabase';
import { Settings as SettingsIcon, CalendarDays, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { WarmHeader } from './components/common/WarmHeader';
import { useSchedule } from './hooks/useSchedule';
import { formatWeekRange } from './lib/dateHelpers';
import SplashScreen from './components/brand/SplashScreen';
import { hasLocalData, getMigrationStatus } from './lib/migrationService';
import { type PhotoCaptureResult } from './components/ocr/PhotoCapture';
import { PhotoImportSheet } from './components/ocr/PhotoImportSheet';
import { OcrReviewForm } from './components/ocr/OcrReviewForm';
import { parseOcrText, type OcrParsedRecipe } from './lib/ocrRecipeParser';
import { OnboardingFlow, isOnboardingComplete } from './components/onboarding/OnboardingFlow';
import { InviteHighlights, isInviteFlow } from './components/onboarding/OnboardingInvitePath';
import type { ParsedRecipe, Recipe } from './types/recipe';

// Lazy-loaded routes
const RecipeDetail = lazy(() => import('./pages/RecipeDetail').then(m => ({ default: m.RecipeDetail })));
const SettingsPage = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const HelpFaq = lazy(() => import('./pages/HelpFaq').then(m => ({ default: m.HelpFaq })));
const SharedRecipeView = lazy(() => import('./pages/SharedRecipeView').then(m => ({ default: m.SharedRecipeView })));

function AppContent() {
  const { t } = useTranslation();
  const { isAuthenticated, loading: authLoading, profile, household } = useAuth();
  const [showImportSheet, setShowImportSheet] = useState(false);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [showAddRecipeSheet, setShowAddRecipeSheet] = useState(false);
  const [importedRecipe, setImportedRecipe] = useState<ParsedRecipe | null>(null);
  const [recipeRefreshKey, setRecipeRefreshKey] = useState(0);
  // Track whether user has explicitly dismissed auth (local-only mode)
  const [authDismissed, setAuthDismissed] = useState(() => {
    return localStorage.getItem('meal-org-auth-dismissed') === 'true';
  });

  // Onboarding state: show for first-launch users
  const [onboardingDone, setOnboardingDone] = useState(() => isOnboardingComplete());
  const [showInviteHighlights, setShowInviteHighlights] = useState(false);
  const { toasts, toast, removeToast } = useToast();
  const { addRecipe } = useRecipes();
  const navigate = useNavigate();
  const location = useLocation();

  // Household feed: new recipes since last login (Sprint 21)
  const { hasNew: hasNewRecipes, count: newRecipeCount, newRecipes, dismiss: dismissNewRecipes } = useNewRecipes();

  // Schedule state lifted to AppContent so WeekNavigation can render inside WarmHeader
  const schedule = useSchedule();

  // OCR state
  const [showOcrCapture, setShowOcrCapture] = useState(false);
  const [showOcrReview, setShowOcrReview] = useState(false);
  const [ocrParsedRecipe, setOcrParsedRecipe] = useState<OcrParsedRecipe | null>(null);
  const [ocrImageUrl, setOcrImageUrl] = useState<string | null>(null);

  // S27-12: Auto-migrate state — silent migration with toast
  const [migrationToast, setMigrationToast] = useState<string | null>(null);

  // S27-12: Auto-migrate on first auth instead of showing wizard
  useEffect(() => {
    if (!isAuthenticated || !profile || !household) return;
    const status = getMigrationStatus();
    if (status === 'completed') return;

    let cancelled = false;
    hasLocalData().then(async (hasData) => {
      if (!hasData || cancelled) return;
      try {
        const { migrateLocalToCloud } = await import('./lib/migrationService');
        await migrateLocalToCloud(household.id, profile.id);
        if (!cancelled) {
          setMigrationToast(t('migration.autoSynced'));
          setTimeout(() => setMigrationToast(null), 3000);
        }
      } catch {
        // Migration failed — user can still use the app; migration available in Settings
      }
    });

    return () => { cancelled = true; };
  }, [isAuthenticated, profile, household, t]);

  // Show auth flow if:
  // 1. Supabase is configured AND
  // 2. User is not authenticated AND
  // 3. User hasn't dismissed auth (chosen local-only)
  const showAuthFlow = isSupabaseConfigured && !isAuthenticated && !authDismissed && !authLoading;

  // Show loading spinner while auth is initializing
  if (authLoading && isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  // Onboarding: show for first-launch users (before auth)
  // Invite-link users skip this and see brief highlights after auth instead
  if (!onboardingDone && !isInviteFlow()) {
    return (
      <OnboardingFlow
        onComplete={() => setOnboardingDone(true)}
      />
    );
  }

  // Invite-link highlights: shown after account creation for invite users
  if (showInviteHighlights) {
    return (
      <InviteHighlights
        onComplete={() => setShowInviteHighlights(false)}
      />
    );
  }

  // Handle Supabase auth callback (PKCE flow — Sprint 23 production fix)
  // When the user is redirected back from Supabase email verification or password reset,
  // the URL contains a `code` query param that must be exchanged for a session.
  if (location.pathname === '/auth/callback') {
    // Supabase's detectSessionInUrl + explicit exchangeCodeForSession in useAuth handles the exchange.
    // Once the session is established, onAuthStateChange fires and isAuthenticated becomes true.
    if (isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    // If auth is no longer loading but user is not authenticated, code exchange likely failed.
    // Show a helpful message with retry instead of spinning forever.
    if (!authLoading && !isAuthenticated) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center px-6">
            <p className="text-gray-700 font-medium mb-2">{t('auth.callbackFailed', 'Verification could not be completed')}</p>
            <p className="text-gray-500 text-sm mb-4">{t('auth.callbackRetry', 'Please try signing in again.')}</p>
            <button
              onClick={() => navigate('/auth')}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-700"
            >
              {t('auth.goToSignIn', 'Go to Sign In')}
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto" />
          <p className="mt-4 text-gray-600 text-sm">{t('auth.verifying', 'Verifying your account...')}</p>
        </div>
      </div>
    );
  }

  // Direct /auth route — render full-screen (S15-01: fix white screen)
  // When Supabase is not configured, redirect to home instead of showing broken auth
  if (location.pathname === '/auth') {
    if (!isSupabaseConfigured) {
      return <Navigate to="/" replace />;
    }
    if (isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    return (
      <AuthFlow
        onSkip={() => {
          localStorage.setItem('meal-org-auth-dismissed', 'true');
          setAuthDismissed(true);
          navigate('/');
        }}
        onComplete={() => {
          setAuthDismissed(false);
          navigate('/');
        }}
      />
    );
  }

  // Auth flow: show if Supabase configured but user not authenticated
  if (showAuthFlow) {
    return (
      <AuthFlow
        onSkip={() => {
          localStorage.setItem('meal-org-auth-dismissed', 'true');
          setAuthDismissed(true);
        }}
        onComplete={() => {
          // Auth + household setup complete — just continue to app
          setAuthDismissed(false); // Reset so they see auth on next fresh visit if logged out
          // Show brief highlights for invite-link users who skipped the full tour
          if (isInviteFlow() && !isOnboardingComplete()) {
            setShowInviteHighlights(true);
          }
        }}
      />
    );
  }

  // Show household setup if authenticated but no profile yet
  if (isAuthenticated && !profile && isSupabaseConfigured) {
    return (
      <AuthFlow
        onSkip={() => {
          localStorage.setItem('meal-org-auth-dismissed', 'true');
          setAuthDismissed(true);
        }}
        onComplete={() => {}}
      />
    );
  }

  const isSchedulePage = location.pathname === '/';
  const isLibraryPage = location.pathname === '/library';
  const isMainPage = isSchedulePage || isLibraryPage;
  const pageTitle = isSchedulePage ? t('header.mealPlanner') : t('header.recipeLibrary');

  const handleRecipeImported = (recipe: ParsedRecipe) => {
    setImportedRecipe(recipe);
    setShowImportSheet(false);
    setShowRecipeForm(true);
    if (!recipe.success) {
      toast.info(t('import.completeMissing'));
    }
  };

  const handleManualAdd = () => {
    const emptyRecipe: ParsedRecipe = {
      title: '',
      ingredients: [],
      instructions: [],
      sourceUrl: '',
      success: true,
    };
    setImportedRecipe(emptyRecipe);
    setShowRecipeForm(true);
  };

  // OCR flow handlers
  const handleOcrImport = () => {
    setShowOcrCapture(true);
  };

  const handleOcrComplete = (result: PhotoCaptureResult) => {
    setShowOcrCapture(false);
    setOcrImageUrl(result.imageUrl);

    if (result.type === 'vision' && result.vision?.success) {
      // Claude Vision returned structured data — create OcrParsedRecipe directly
      const parsed: OcrParsedRecipe = {
        title: result.vision.title,
        ingredients: result.vision.ingredients,
        instructions: result.vision.instructions,
        sourceUrl: '',
        success: true,
        confidence: {
          title: result.vision.confidence,
          ingredients: result.vision.confidence,
          instructions: result.vision.confidence,
          overall: result.vision.confidence,
        },
        rawText: `[Extracted by AI vision]\nTitle: ${result.vision.title}\nIngredients: ${result.vision.ingredients.join(', ')}\nInstructions: ${result.vision.instructions.join(' | ')}`,
      };
      setOcrParsedRecipe(parsed);
      setShowOcrReview(true);
    } else if (result.type === 'ocr' && result.ocr?.success && result.ocr.text) {
      // Tesseract fallback — parse raw text
      const parsed = parseOcrText(result.ocr.text);
      setOcrParsedRecipe(parsed);
      setShowOcrReview(true);
    } else {
      const error = result.vision?.error || result.ocr?.error || t('ocr.ocrFailed');
      toast.error(error);
    }
  };

  const handleOcrSave = async (recipe: { title: string; ingredients: string[]; instructions: string[] }) => {
    try {
      await addRecipe({
        title: recipe.title,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        imageUrl: undefined,
        sourceUrl: undefined,
        lastCookedDate: undefined,
        tags: [],
      });
      toast.success(t('toast.recipeSaved', { title: recipe.title }));
      setShowOcrReview(false);
      setOcrParsedRecipe(null);
      setOcrImageUrl(null);
      setRecipeRefreshKey((k) => k + 1);
    } catch {
      toast.error(t('toast.recipeSaveFailed'));
    }
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    try {
      await addRecipe({
        title: recipe.title,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        imageUrl: recipe.imageUrl,
        sourceUrl: recipe.sourceUrl,
        lastCookedDate: recipe.lastCookedDate,
        tags: recipe.tags,
      });
      toast.success(t('toast.recipeSaved', { title: recipe.title }));
      setRecipeRefreshKey((k) => k + 1);
    } catch (error) {
      console.error('Failed to save recipe:', error);
      toast.error(t('toast.recipeSaveFailed'));
      throw error;
    }
  };

  const handleRecipeClick = (recipe: Recipe) => {
    navigate(`/recipe/${recipe.id}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--fs-bg-base, #FAF9F6)', paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Warm Amber Header — Sprint 23 Design Spec V1.6 */}
      {isMainPage && (
        <WarmHeader
          icon={isSchedulePage
            ? <CalendarDays className="w-6 h-6" />
            : <BookOpen className="w-6 h-6" />
          }
          title={pageTitle}
          rightAction={
            <div className="flex items-center gap-2">
              <SyncStatusBadge />
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center justify-center"
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: 'var(--fs-warm-header-btn-bg, #FFFFFF)',
                  border: '1px solid var(--fs-warm-header-btn-border, #E7E5E4)',
                  borderRadius: '8px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
                aria-label={t('nav.settings')}
              >
                <SettingsIcon className="w-5 h-5" style={{ color: 'var(--fs-text-muted, #78716C)' }} />
              </button>
            </div>
          }
        >
          {/* S23-06: Week navigation inside WarmHeader for Schedule */}
          {isSchedulePage && (
            <div className="flex items-center justify-between">
              <button
                onClick={schedule.goToPrevWeek}
                className="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
                style={{ color: 'var(--fs-text-muted, #78716C)' }}
                aria-label={t('schedule.previousWeek', 'Previous week')}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={schedule.goToCurrentWeek}
                className="text-sm font-medium transition-colors"
                style={{ color: 'var(--fs-text-secondary, #44403C)' }}
                title={t('schedule.thisWeek')}
              >
                {t('schedule.weekOf', { range: formatWeekRange(schedule.currentWeekStart) })}
              </button>
              <button
                onClick={schedule.goToNextWeek}
                className="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
                style={{ color: 'var(--fs-text-muted, #78716C)' }}
                aria-label={t('schedule.nextWeek', 'Next week')}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </WarmHeader>
      )}

      {/* Full-width pages — these manage their own headers and layout */}
      <Routes>
        <Route
          path="/recipe/shared/:recipeId"
          element={
            <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"><SkeletonLoader count={5} type="text" /></div>}>
              <SharedRecipeView />
            </Suspense>
          }
        />
        <Route
          path="/recipe/:id"
          element={
            <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"><SkeletonLoader count={1} type="text" /></div>}>
              <RecipeDetail />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"><SkeletonLoader count={3} type="list" /></div>}>
              <SettingsPage />
            </Suspense>
          }
        />
        <Route path="*" element={null} />
      </Routes>

      {/* Main Content — constrained width for Schedule, Library, etc. */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <ErrorBoundary>
          <Routes>
            <Route
              path="/"
              element={<WeeklySchedule onRecipeClick={handleRecipeClick} schedule={schedule} />}
            />
            <Route
              path="/library"
              element={
                <RecipeLibrary
                  onRecipeClick={handleRecipeClick}
                  onImportClick={() => setShowAddRecipeSheet(true)}
                  onAddManualClick={handleManualAdd}
                  refreshKey={recipeRefreshKey}
                  newRecipes={newRecipes}
                  onDismissNewRecipes={dismissNewRecipes}
                />
              }
            />
            <Route
              path="/privacy"
              element={
                <Suspense fallback={<SkeletonLoader count={5} type="text" />}>
                  <PrivacyPolicy />
                </Suspense>
              }
            />
            <Route
              path="/help"
              element={
                <Suspense fallback={<SkeletonLoader count={5} type="text" />}>
                  <HelpFaq />
                </Suspense>
              }
            />
            {/* RecipeDetail and SharedRecipeView are rendered above */}
            <Route path="/recipe/shared/:recipeId" element={null} />
            <Route path="/recipe/:id" element={null} />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* Bottom Navigation — 3-item: Schedule, FAB, Library (S16-01) */}
      {isMainPage && (
        <BottomNav
          onAddClick={() => setShowAddRecipeSheet(true)}
          showLibraryBadge={hasNewRecipes}
          newRecipeCount={newRecipeCount}
        />
      )}

      {/* Add Recipe Bottom Sheet — full-screen with 4 import options (S16-02/S16-03) */}
      <AddRecipeSheet
        open={showAddRecipeSheet}
        onOpenChange={setShowAddRecipeSheet}
        onWebsiteImport={() => setShowImportSheet(true)}
        onSocialImport={() => setShowImportSheet(true)}
        onScanImport={() => { if (handleOcrImport) handleOcrImport(); }}
        onManualAdd={handleManualAdd}
      />

      {/* Import Sheet */}
      <ImportSheet
        open={showImportSheet}
        onOpenChange={setShowImportSheet}
        onRecipeImported={handleRecipeImported}
        onManualAdd={handleManualAdd}
        onOcrImport={handleOcrImport}
      />

      {/* OCR Photo Capture — S24-03: bottom sheet */}
      <PhotoImportSheet
        open={showOcrCapture}
        onOpenChange={setShowOcrCapture}
        onComplete={handleOcrComplete}
      />

      {/* OCR Review Form */}
      {showOcrReview && ocrParsedRecipe && (
        <OcrReviewForm
          parsedRecipe={ocrParsedRecipe}
          imageUrl={ocrImageUrl}
          onSave={handleOcrSave}
          onRetry={() => { setShowOcrReview(false); setShowOcrCapture(true); }}
          onClose={() => { setShowOcrReview(false); setOcrParsedRecipe(null); }}
        />
      )}

      {/* Recipe Form */}
      <RecipeForm
        open={showRecipeForm}
        onOpenChange={setShowRecipeForm}
        recipe={importedRecipe}
        onSave={handleSaveRecipe}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* S27-12: Auto-migration toast */}
      {migrationToast && (
        <div className="fixed top-4 left-4 right-4 z-[100] animate-fade-in">
          <div
            className="rounded-xl px-4 py-3 text-sm shadow-lg text-center font-medium"
            style={{
              backgroundColor: 'var(--fs-toast-bg, #1C1917)',
              color: 'var(--fs-toast-text, #FAFAF9)',
              border: '1px solid var(--fs-border-default)',
            }}
          >
            {migrationToast}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [splashDone, setSplashDone] = useState(() => {
    // Skip splash on HMR / subsequent renders within same session
    return sessionStorage.getItem('fork-spoon-splash-shown') === 'true';
  });

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('fork-spoon-splash-shown', 'true');
    setSplashDone(true);
  }, []);

  return (
    <>
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
      <BrowserRouter>
        <AuthProvider>
          <SyncProvider>
            <AppContent />
          </SyncProvider>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
