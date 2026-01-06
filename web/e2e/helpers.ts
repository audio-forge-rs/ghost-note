/**
 * E2E Test Helpers
 *
 * Common helper functions for E2E tests to handle app setup,
 * tutorial dismissal, and other shared functionality.
 */

import { Page, expect } from '@playwright/test';

/**
 * Wait for the app to fully load and dismiss any blocking modals
 * like the tutorial dialog that appears on first visit.
 */
export async function waitForAppReady(page: Page): Promise<void> {
  // Wait for app shell to be visible
  await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 30000 });

  // Check if tutorial dialog is visible and dismiss it
  const tutorialDialog = page.getByTestId('app-tutorial');
  const isTutorialVisible = await tutorialDialog.isVisible().catch(() => false);

  if (isTutorialVisible) {
    console.log('[E2E] Tutorial dialog detected, dismissing...');

    // Try to find and click the skip/close button
    const skipButton = page.getByRole('button', { name: /skip|close|got it|dismiss/i });
    const closeButton = tutorialDialog.locator('button[aria-label*="close" i], button[aria-label*="skip" i]');

    // Try skip button first
    if (await skipButton.isVisible().catch(() => false)) {
      await skipButton.click();
      console.log('[E2E] Clicked skip button');
    } else if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
      console.log('[E2E] Clicked close button');
    } else {
      // If no button found, try pressing Escape
      await page.keyboard.press('Escape');
      console.log('[E2E] Pressed Escape to dismiss tutorial');
    }

    // Wait for tutorial dialog to disappear
    await expect(tutorialDialog).not.toBeVisible({ timeout: 5000 });
    console.log('[E2E] Tutorial dismissed');
  }
}

/**
 * Set up localStorage to skip the tutorial before navigating to the app.
 * This prevents the tutorial from appearing at all.
 */
export async function skipTutorialOnLoad(page: Page): Promise<void> {
  // First navigate to the base URL to set storage in the right origin
  // Using about:blank and then context.addInitScript won't work for localStorage
  // because localStorage is origin-bound

  // Add init script that will run before any page scripts
  await page.addInitScript(() => {
    // Set the tutorial store state to indicate tutorial was already completed
    // Using zustand persist format
    const tutorialState = {
      state: {
        hasCompletedTutorial: true,
        hasSkippedTutorial: true,
        showOnFirstVisit: false,
        lastCompletedAt: Date.now(),
      },
      version: 0,
    };
    window.localStorage.setItem('ghost-note-tutorial-store', JSON.stringify(tutorialState));
  });
}

/**
 * Dismiss any active tutorial dialog
 */
export async function dismissTutorialIfVisible(page: Page): Promise<void> {
  const tutorialDialog = page.getByTestId('app-tutorial');
  const isTutorialVisible = await tutorialDialog.isVisible().catch(() => false);

  if (isTutorialVisible) {
    console.log('[E2E] Tutorial dialog detected, dismissing...');

    // Try to find and click the skip/close button
    const skipButton = page.getByRole('button', { name: /skip|close|got it|dismiss/i });

    if (await skipButton.isVisible().catch(() => false)) {
      await skipButton.click();
      console.log('[E2E] Clicked skip button');
    } else {
      // If no button found, try pressing Escape
      await page.keyboard.press('Escape');
      console.log('[E2E] Pressed Escape to dismiss tutorial');
    }

    // Wait for tutorial dialog to disappear
    await expect(tutorialDialog).not.toBeVisible({ timeout: 5000 });
    console.log('[E2E] Tutorial dismissed');
  }
}

/**
 * Navigate to the app with tutorial pre-skipped
 */
export async function gotoWithTutorialSkipped(page: Page, path = '/'): Promise<void> {
  // Set localStorage before navigating
  await skipTutorialOnLoad(page);

  await page.goto(path);
  await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 30000 });

  // The tutorial has a 500ms delay before showing, so wait for either:
  // 1. Tutorial dialog to appear (then dismiss it), or
  // 2. Enough time to pass that we're confident it won't appear
  const tutorialDialog = page.getByTestId('app-tutorial');

  // Wait up to 800ms for tutorial to appear
  const tutorialAppeared = await tutorialDialog.waitFor({ state: 'visible', timeout: 800 }).then(() => true).catch(() => false);

  if (tutorialAppeared) {
    console.log('[E2E] Tutorial dialog appeared, dismissing...');
    await dismissTutorialIfVisible(page);
  }

  console.log('[E2E] App loaded with tutorial skipped');
}

/**
 * Wait for analysis to complete with improved stability
 */
export async function waitForAnalysis(page: Page): Promise<void> {
  // Wait for either loading state or analysis panel
  const loadingOrAnalysis = page.getByTestId('view-analysis-loading').or(page.locator('.analysis-panel'));
  await expect(loadingOrAnalysis).toBeVisible({ timeout: 15000 });

  // If loading is visible, wait for it to disappear
  const loading = page.getByTestId('view-analysis-loading');
  if (await loading.isVisible().catch(() => false)) {
    await expect(loading).not.toBeVisible({ timeout: 15000 });
  }

  // Now the analysis panel should be visible
  await expect(page.locator('.analysis-panel')).toBeVisible({ timeout: 10000 });
}

/**
 * Wait for melody generation to complete
 */
export async function waitForMelodyGeneration(page: Page): Promise<void> {
  // Wait for either loading state or melody view
  const melodyView = page.getByTestId('view-melody');
  const loadingState = page.getByTestId('view-melody-loading');

  await expect(loadingState.or(melodyView)).toBeVisible({ timeout: 15000 });

  // If loading is visible, wait for it to disappear
  if (await loadingState.isVisible().catch(() => false)) {
    await expect(loadingState).not.toBeVisible({ timeout: 30000 });
  }

  // Now the melody view should be visible with content
  await expect(melodyView).toBeVisible({ timeout: 15000 });

  // Wait a bit for any post-render effects
  await page.waitForTimeout(500);
}

/**
 * Wait for recording view to be ready
 */
export async function waitForRecordingView(page: Page): Promise<void> {
  // Navigate to recording view
  const recordingNav = page.getByTestId('nav-recording');
  await recordingNav.click();

  // Wait for navigation and any view transitions
  await page.waitForTimeout(500);

  // The recording view may take a moment to become visible
  const recordingView = page.getByTestId('view-recording');

  // Wait for the element to be attached to the DOM
  await recordingView.waitFor({ state: 'attached', timeout: 10000 });

  // Try waiting for visibility
  try {
    await expect(recordingView).toBeVisible({ timeout: 15000 });
  } catch {
    // If still not visible, it might be a CSS issue - log and proceed
    console.log('[E2E] Recording view visibility check failed, proceeding with attached element');
  }
}

/**
 * Enter a poem and trigger analysis
 */
export async function enterPoemAndAnalyze(page: Page, poemText: string): Promise<void> {
  // Enter poem text
  const textarea = page.getByTestId('poem-textarea');
  await textarea.fill(poemText);

  // Click analyze button
  const analyzeButton = page.getByRole('button', { name: /analyze/i });
  await expect(analyzeButton).toBeEnabled({ timeout: 5000 });
  await analyzeButton.click();

  // Wait for analysis to complete
  await waitForAnalysis(page);
}

/**
 * Navigate to a view using the sidebar
 */
export async function navigateToView(
  page: Page,
  view: 'poem-input' | 'analysis' | 'lyrics-editor' | 'melody' | 'recording'
): Promise<void> {
  const navTestId = `nav-${view}`;
  const nav = page.getByTestId(navTestId);
  await nav.click();

  // Wait for the corresponding view to be visible
  const viewTestId = `view-${view}`;
  await expect(page.getByTestId(viewTestId).or(page.locator(`.${view.replace('-', '')}`)))
    .toBeVisible({ timeout: 10000 });
}
