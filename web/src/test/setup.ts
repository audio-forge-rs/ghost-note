/**
 * Vitest setup file
 *
 * Configures testing environment with jest-dom matchers
 */

import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Cleanup accessibility live regions after tests
import { cleanupLiveRegions } from '@/hooks/useAnnouncer';

afterEach(() => {
  // Clean up any live regions created during tests
  cleanupLiveRegions();
});
