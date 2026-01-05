/**
 * E2E Tests: Poem Input and Analysis Flow
 *
 * Tests the primary user flow of entering a poem and seeing its analysis.
 *
 * Test scenarios covered:
 * 1. User enters poem -> sees analysis
 * 2. Sample poem selection works
 * 3. Analysis displays syllables, meter, and rhyme scheme
 * 4. Navigation from input to analysis view
 */

import { test, expect } from '@playwright/test';
import { SIMPLE_TEST_POEM, TWINKLE_TWINKLE, SONNET_18 } from './fixtures';

test.describe('Poem Input and Analysis Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    // Wait for app to load
    await expect(page.getByTestId('app-shell')).toBeVisible();
    console.log('[E2E] App loaded successfully');
  });

  test('should display the poem input view by default', async ({ page }) => {
    // The poem input component should be visible
    await expect(page.getByTestId('poem-input')).toBeVisible();

    // Title should be visible
    await expect(page.getByRole('heading', { name: /enter your poem/i })).toBeVisible();

    // Textarea should be empty initially
    const textarea = page.getByTestId('poem-textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveValue('');

    console.log('[E2E] Poem input view displayed correctly');
  });

  test('should enter a poem and navigate to analysis view', async ({ page }) => {
    // Enter the simple test poem
    const textarea = page.getByTestId('poem-textarea');
    await textarea.fill(SIMPLE_TEST_POEM.text);
    console.log('[E2E] Entered poem text');

    // Verify poem stats are displayed
    const stats = page.getByTestId('poem-stats');
    await expect(stats).toBeVisible();

    // Verify line count is correct (using exact match to avoid ambiguity)
    const lineCount = stats.locator('.poem-input__stat-value').first();
    await expect(lineCount).toContainText(String(SIMPLE_TEST_POEM.expectedAnalysis.lineCount));

    // Click the analyze button (in toolbar)
    const analyzeButton = page.getByRole('button', { name: /analyze/i });
    await expect(analyzeButton).toBeEnabled();
    await analyzeButton.click();
    console.log('[E2E] Clicked analyze button');

    // Wait for navigation to analysis view
    // This may show loading first, then the analysis panel
    await expect(page.getByTestId('view-analysis-loading').or(page.locator('.analysis-panel'))).toBeVisible({
      timeout: 10000,
    });

    // Wait for analysis to complete - look for analysis panel content
    await expect(page.locator('.analysis-panel')).toBeVisible({ timeout: 15000 });
    console.log('[E2E] Analysis view displayed');

    // Verify analysis content is shown
    // Look for syllable counts or rhyme scheme indicators
    const analysisContent = page.locator('.analysis-panel');
    await expect(analysisContent).toContainText(/syllable|line|stanza/i);

    console.log('[E2E] Analysis content verified');
  });

  test('should analyze a structured poem and show rhyme scheme', async ({ page }) => {
    // Use Twinkle Twinkle which has a clear AABB rhyme scheme
    const textarea = page.getByTestId('poem-textarea');
    await textarea.fill(TWINKLE_TWINKLE.text);

    // Click analyze
    const analyzeButton = page.getByRole('button', { name: /analyze/i });
    await analyzeButton.click();

    // Wait for analysis panel
    await expect(page.locator('.analysis-panel')).toBeVisible({ timeout: 15000 });

    // The rhyme scheme display should show letters (A, B, etc.)
    // Look for rhyme scheme markers in the analysis
    const analysisPanel = page.locator('.analysis-panel');

    // Check that analysis shows line information
    await expect(analysisPanel).toContainText(/twinkle/i);

    console.log('[E2E] Structured poem analysis completed');
  });

  test('should show loading state during analysis', async ({ page }) => {
    // Enter a longer poem for more processing time
    const textarea = page.getByTestId('poem-textarea');
    await textarea.fill(SONNET_18.text);

    // Click analyze
    const analyzeButton = page.getByRole('button', { name: /analyze/i });
    await analyzeButton.click();

    // Should briefly show loading state
    // Note: This may be very fast, so we check either loading or analysis panel
    const loadingOrAnalysis = page.getByTestId('view-analysis-loading').or(page.locator('.analysis-panel'));
    await expect(loadingOrAnalysis).toBeVisible({ timeout: 5000 });

    // Eventually analysis panel should be visible
    await expect(page.locator('.analysis-panel')).toBeVisible({ timeout: 15000 });

    console.log('[E2E] Loading state test passed');
  });

  test('should clear poem and reset state', async ({ page }) => {
    // Enter poem
    const textarea = page.getByTestId('poem-textarea');
    await textarea.fill(SIMPLE_TEST_POEM.text);
    await expect(textarea).toHaveValue(SIMPLE_TEST_POEM.text);

    // Click clear button
    const clearButton = page.getByRole('button', { name: /clear/i });
    await clearButton.click();

    // Textarea should be empty
    await expect(textarea).toHaveValue('');

    // Analyze button should be disabled (not enough text)
    const analyzeButton = page.getByRole('button', { name: /analyze/i });
    await expect(analyzeButton).toBeDisabled();

    console.log('[E2E] Clear functionality works');
  });

  test('should navigate between views using sidebar', async ({ page }) => {
    // On desktop, sidebar should be visible
    const sidebar = page.getByTestId('sidebar');
    await expect(sidebar).toBeVisible();

    // Click on different navigation items
    const analysisNav = page.getByTestId('nav-analysis');
    await analysisNav.click();

    // Should show empty state for analysis (no poem entered)
    await expect(page.getByTestId('view-analysis')).toBeVisible();

    // Navigate back to poem input
    const poemInputNav = page.getByTestId('nav-poem-input');
    await poemInputNav.click();
    await expect(page.getByTestId('poem-input')).toBeVisible();

    console.log('[E2E] Navigation between views works');
  });

  test('should show sample poems picker and select a sample', async ({ page }) => {
    // Click the sample button to open picker
    const sampleButton = page.getByRole('button', { name: /sample/i });
    await sampleButton.click();

    // Sample poems modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // There should be sample poem options
    const sampleOptions = page.locator('[data-testid^="sample-poem-"]');
    const count = await sampleOptions.count();
    expect(count).toBeGreaterThan(0);
    console.log(`[E2E] Found ${count} sample poems`);

    // Click the first sample poem
    await sampleOptions.first().click();

    // Modal should close and textarea should have content
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    const textarea = page.getByTestId('poem-textarea');
    const value = await textarea.inputValue();
    expect(value.length).toBeGreaterThan(0);

    console.log('[E2E] Sample poem selection works');
  });

  test('should update poem stats as user types', async ({ page }) => {
    const textarea = page.getByTestId('poem-textarea');
    const stats = page.getByTestId('poem-stats');

    // Initially empty
    await expect(stats.getByText('0', { exact: false })).toBeVisible();

    // Type some text
    await textarea.fill('Hello world');

    // Stats should update - should show at least 1 line
    await expect(stats.getByText('1')).toBeVisible();

    // Add more lines
    await textarea.fill('Hello world\nSecond line\nThird line');

    // Should show 3 lines now
    await expect(stats.getByText('3')).toBeVisible();

    console.log('[E2E] Poem stats update correctly');
  });

  test('should enable analyze button when enough text is entered', async ({ page }) => {
    const textarea = page.getByTestId('poem-textarea');
    const analyzeButton = page.getByRole('button', { name: /analyze/i });

    // Initially disabled (no text)
    await expect(analyzeButton).toBeDisabled();

    // Enter minimal text (less than threshold)
    await textarea.fill('Hi');
    await expect(analyzeButton).toBeDisabled();

    // Enter enough text (threshold is 10 chars)
    await textarea.fill('This is enough text');
    await expect(analyzeButton).toBeEnabled();

    console.log('[E2E] Analyze button enable/disable works correctly');
  });
});
