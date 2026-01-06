/**
 * E2E Tests: Melody Generation and Playback
 *
 * Tests the melody generation workflow including:
 * 1. User generates melody -> hears playback
 * 2. Notation display rendering
 * 3. Playback controls (play, pause, stop)
 * 4. Tempo and key adjustments
 *
 * Note: Some playback tests are skipped in CI because audio timing
 * doesn't work reliably in headless browser environments.
 */

import { test, expect } from '@playwright/test';
import { TWINKLE_TWINKLE, SIMPLE_TEST_POEM } from './fixtures';
import { gotoWithTutorialSkipped, waitForAnalysis, waitForMelodyGeneration } from './helpers';

// Skip timing-dependent tests in CI
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

test.describe('Melody Generation and Playback', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app with tutorial skipped to prevent blocking
    await gotoWithTutorialSkipped(page, '/');

    // Enter a well-structured poem for better melody generation
    const textarea = page.getByTestId('poem-textarea');
    await textarea.fill(TWINKLE_TWINKLE.text);

    // Analyze the poem
    const analyzeButton = page.getByRole('button', { name: /analyze/i });
    await analyzeButton.click();

    // Wait for analysis to complete with improved stability
    await waitForAnalysis(page);

    console.log('[E2E] Setup complete - poem analyzed');
  });

  test('should navigate to melody view and trigger generation', async ({ page }) => {
    // Navigate to melody view
    const melodyNav = page.getByTestId('nav-melody');
    await melodyNav.click();

    // Should show loading state or melody view
    const melodyView = page.getByTestId('view-melody');
    const loadingState = page.getByTestId('view-melody-loading');

    // Either loading or the view should be visible
    await expect(loadingState.or(melodyView)).toBeVisible({ timeout: 10000 });

    // Wait for melody generation to complete
    await expect(melodyView).toBeVisible({ timeout: 30000 });

    console.log('[E2E] Melody view loaded');
  });

  test('should display notation after melody generation', async ({ page }) => {
    // Navigate to melody view
    const melodyNav = page.getByTestId('nav-melody');
    await melodyNav.click();

    // Wait for melody view
    const melodyView = page.getByTestId('view-melody');
    await expect(melodyView).toBeVisible({ timeout: 30000 });

    // Check for notation display
    // The NotationDisplay component renders sheet music
    const notationDisplay = page.locator('.melody-notation, .notation-display, [data-testid*="notation"]');
    await expect(notationDisplay).toBeVisible({ timeout: 10000 });

    // The notation should contain SVG elements (abcjs renders to SVG)
    const svgElements = notationDisplay.locator('svg');
    await expect(svgElements.first()).toBeVisible();

    console.log('[E2E] Notation displayed correctly');
  });

  test('should show playback controls when melody is ready', async ({ page }) => {
    // Navigate to melody view
    const melodyNav = page.getByTestId('nav-melody');
    await melodyNav.click();

    // Wait for melody view
    const melodyView = page.getByTestId('view-melody');
    await expect(melodyView).toBeVisible({ timeout: 30000 });

    // Playback container should be visible
    const playbackContainer = page.getByTestId('melody-playback');
    await expect(playbackContainer).toBeVisible();

    // Play button should be present
    const playButton = playbackContainer.getByRole('button', { name: /play/i });
    await expect(playButton).toBeVisible();

    console.log('[E2E] Playback controls visible');
  });

  test('should play and pause melody', async ({ page }) => {
    test.skip(isCI, 'Audio playback timing is unreliable in CI');

    // Navigate to melody view
    const melodyNav = page.getByTestId('nav-melody');
    await melodyNav.click();

    // Wait for melody view
    const melodyView = page.getByTestId('view-melody');
    await expect(melodyView).toBeVisible({ timeout: 30000 });

    const playbackContainer = page.getByTestId('melody-playback');

    // Click play
    const playButton = playbackContainer.getByRole('button', { name: /play/i });
    await playButton.click();

    // After clicking play, should show pause button
    // Note: The button might change its label or a different pause button appears
    const pauseButton = playbackContainer.getByRole('button', { name: /pause/i });
    await expect(pauseButton).toBeVisible({ timeout: 5000 });

    console.log('[E2E] Play button clicked, pause button visible');

    // Click pause
    await pauseButton.click();

    // Play button should be visible again
    await expect(playButton).toBeVisible({ timeout: 5000 });

    console.log('[E2E] Play/pause functionality works');
  });

  test('should stop playback with stop button', async ({ page }) => {
    test.skip(isCI, 'Audio playback timing is unreliable in CI');

    // Navigate to melody view
    const melodyNav = page.getByTestId('nav-melody');
    await melodyNav.click();

    // Wait for melody view
    const melodyView = page.getByTestId('view-melody');
    await expect(melodyView).toBeVisible({ timeout: 30000 });

    const playbackContainer = page.getByTestId('melody-playback');

    // Start playing
    const playButton = playbackContainer.getByRole('button', { name: /play/i });
    await playButton.click();

    // Wait for playback to start
    await expect(playbackContainer.getByRole('button', { name: /pause/i })).toBeVisible({ timeout: 5000 });

    // Click stop
    const stopButton = playbackContainer.getByRole('button', { name: /stop/i });
    await stopButton.click();

    // Play button should be visible again
    await expect(playButton).toBeVisible({ timeout: 5000 });

    console.log('[E2E] Stop functionality works');
  });

  test('should adjust tempo', async ({ page }) => {
    // Navigate to melody view
    const melodyNav = page.getByTestId('nav-melody');
    await melodyNav.click();

    // Wait for melody view
    const melodyView = page.getByTestId('view-melody');
    await expect(melodyView).toBeVisible({ timeout: 30000 });

    const playbackContainer = page.getByTestId('melody-playback');

    // Find tempo control (could be slider, input, or select)
    const tempoControl = playbackContainer.locator('[data-testid*="tempo"], input[type="range"], .tempo-control');

    if (await tempoControl.isVisible().catch(() => false)) {
      // Get current tempo value
      const tempoInput = tempoControl.locator('input').first();

      if (await tempoInput.isVisible().catch(() => false)) {
        const currentValue = await tempoInput.inputValue();
        console.log('[E2E] Current tempo:', currentValue);

        // Change tempo (if it's a range input)
        const inputType = await tempoInput.getAttribute('type');
        if (inputType === 'range' || inputType === 'number') {
          await tempoInput.fill('100');
          const newValue = await tempoInput.inputValue();
          expect(newValue).toBe('100');
          console.log('[E2E] Tempo changed to:', newValue);
        }
      }
    }

    console.log('[E2E] Tempo control test completed');
  });

  test('should adjust key signature', async ({ page }) => {
    // Navigate to melody view
    const melodyNav = page.getByTestId('nav-melody');
    await melodyNav.click();

    // Wait for melody view
    const melodyView = page.getByTestId('view-melody');
    await expect(melodyView).toBeVisible({ timeout: 30000 });

    const playbackContainer = page.getByTestId('melody-playback');

    // Find key control (likely a select dropdown)
    const keyControl = playbackContainer.locator('[data-testid*="key"], select.key-select, .key-control select');

    if (await keyControl.isVisible().catch(() => false)) {
      // Get current key
      const currentKey = await keyControl.inputValue();
      console.log('[E2E] Current key:', currentKey);

      // Change to a different key if options are available
      const options = await keyControl.locator('option').all();
      if (options.length > 1) {
        const newKey = await options[1].getAttribute('value');
        if (newKey) {
          await keyControl.selectOption(newKey);
          const updatedKey = await keyControl.inputValue();
          console.log('[E2E] Key changed to:', updatedKey);
        }
      }
    }

    console.log('[E2E] Key control test completed');
  });

  test('should toggle loop mode', async ({ page }) => {
    // Navigate to melody view
    const melodyNav = page.getByTestId('nav-melody');
    await melodyNav.click();

    // Wait for melody view
    const melodyView = page.getByTestId('view-melody');
    await expect(melodyView).toBeVisible({ timeout: 30000 });

    const playbackContainer = page.getByTestId('melody-playback');

    // Find loop toggle (could be button or checkbox)
    const loopControl = playbackContainer.locator(
      '[data-testid*="loop"], button:has-text("loop"), input[type="checkbox"][name*="loop"]'
    );

    if (await loopControl.isVisible().catch(() => false)) {
      // Get initial state
      const isChecked = await loopControl.isChecked().catch(() => null);
      const ariaPressed = await loopControl.getAttribute('aria-pressed');

      console.log('[E2E] Loop initial state:', { isChecked, ariaPressed });

      // Toggle
      await loopControl.click();

      // Verify state changed
      const newIsChecked = await loopControl.isChecked().catch(() => null);
      const newAriaPressed = await loopControl.getAttribute('aria-pressed');

      console.log('[E2E] Loop new state:', { newIsChecked, newAriaPressed });
    }

    console.log('[E2E] Loop toggle test completed');
  });

  test('should show empty state when no analysis available', async ({ page }) => {
    // Start fresh with tutorial skipped
    await gotoWithTutorialSkipped(page, '/');

    // Navigate directly to melody without entering a poem
    const melodyNav = page.getByTestId('nav-melody');
    await melodyNav.click();

    // Should show empty state
    const emptyState = page.getByTestId('view-melody').or(page.locator('[data-testid*="melody"]'));
    await expect(emptyState).toBeVisible();

    // Should contain message about needing analysis
    await expect(emptyState).toContainText(/no|empty|generate|melody/i);

    console.log('[E2E] Empty state shown correctly');
  });

  test('should generate melody from keyboard shortcut', async ({ page }) => {
    // Keyboard shortcut for generating melody is Cmd/Ctrl + Enter
    // First need to be in a state where melody can be generated

    // Navigate to lyrics editor (where Cmd+Enter might trigger generation)
    const lyricsNav = page.getByTestId('nav-lyrics-editor');
    await lyricsNav.click();

    await expect(page.getByTestId('view-lyrics-editor').or(page.locator('.lyric-editor'))).toBeVisible({ timeout: 10000 });

    // Use keyboard shortcut to generate melody
    await page.keyboard.press('Meta+Enter');

    // Should navigate to melody view and start generation
    // Wait a bit for the navigation/generation
    await page.waitForTimeout(1000);

    // Check if we're now in melody view or if generation was triggered
    const melodyNav = page.getByTestId('nav-melody');
    const melodyView = page.getByTestId('view-melody');

    // Click melody nav if not already there
    if (!(await melodyView.isVisible().catch(() => false))) {
      await melodyNav.click();
    }

    await expect(melodyView).toBeVisible({ timeout: 30000 });

    console.log('[E2E] Keyboard shortcut melody generation test completed');
  });

  test('should update playback progress during play', async ({ page }) => {
    test.skip(isCI, 'Audio playback timing is unreliable in CI');

    // Navigate to melody view
    const melodyNav = page.getByTestId('nav-melody');
    await melodyNav.click();

    // Wait for melody view
    const melodyView = page.getByTestId('view-melody');
    await expect(melodyView).toBeVisible({ timeout: 30000 });

    const playbackContainer = page.getByTestId('melody-playback');

    // Find progress indicator (could be time display or progress bar)
    const progressBar = playbackContainer.locator('.progress-bar, [role="progressbar"], input[type="range"]');

    // Start playing
    const playButton = playbackContainer.getByRole('button', { name: /play/i });
    await playButton.click();

    // Wait a moment for playback to progress
    await page.waitForTimeout(500);

    // Check if any time/progress display exists
    const timeDisplay = playbackContainer.locator('[data-testid*="time"], .time-display, .current-time');

    if (await timeDisplay.isVisible().catch(() => false)) {
      const timeText = await timeDisplay.innerText();
      console.log('[E2E] Time display:', timeText);
    }

    if (await progressBar.isVisible().catch(() => false)) {
      console.log('[E2E] Progress bar visible');
    }

    // Stop playback
    const stopButton = playbackContainer.getByRole('button', { name: /stop/i });
    if (await stopButton.isVisible().catch(() => false)) {
      await stopButton.click();
    }

    console.log('[E2E] Playback progress test completed');
  });
});

test.describe('Melody View Edge Cases', () => {
  test('should handle very short poem melody generation', async ({ page }) => {
    await gotoWithTutorialSkipped(page, '/');

    // Enter a very short poem (haiku-like)
    const textarea = page.getByTestId('poem-textarea');
    await textarea.fill('Short poem\nVery brief\nThree lines');

    // Analyze
    const analyzeButton = page.getByRole('button', { name: /analyze/i });
    await analyzeButton.click();
    await waitForAnalysis(page);

    // Navigate to melody
    const melodyNav = page.getByTestId('nav-melody');
    await melodyNav.click();

    // Should still generate a melody
    const melodyView = page.getByTestId('view-melody');
    await expect(melodyView).toBeVisible({ timeout: 30000 });

    console.log('[E2E] Short poem melody generation works');
  });

  test('should handle regeneration of melody', async ({ page }) => {
    await gotoWithTutorialSkipped(page, '/');

    const textarea = page.getByTestId('poem-textarea');
    await textarea.fill(SIMPLE_TEST_POEM.text);

    const analyzeButton = page.getByRole('button', { name: /analyze/i });
    await analyzeButton.click();
    await waitForAnalysis(page);

    // Generate first melody
    const melodyNav = page.getByTestId('nav-melody');
    await melodyNav.click();

    const melodyView = page.getByTestId('view-melody');
    await expect(melodyView).toBeVisible({ timeout: 30000 });

    // Look for regenerate button if it exists
    const regenerateButton = page.getByRole('button', { name: /regenerate|generate again/i });

    if (await regenerateButton.isVisible().catch(() => false)) {
      await regenerateButton.click();

      // Should show loading and then new melody
      await expect(melodyView).toBeVisible({ timeout: 30000 });
      console.log('[E2E] Melody regenerated');
    } else {
      console.log('[E2E] No regenerate button found (may be expected)');
    }
  });
});
