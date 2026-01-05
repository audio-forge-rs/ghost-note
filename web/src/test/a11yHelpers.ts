/**
 * Accessibility Testing Helpers
 *
 * Helper functions for accessibility testing with axe-core.
 */

import { axe, type AxeCore } from 'vitest-axe';

type AxeResults = AxeCore.AxeResults;

/**
 * Run axe-core on a container and assert no violations
 */
export async function expectNoA11yViolations(container: Element): Promise<void> {
  const results = await axe(container);
  if (results.violations.length > 0) {
    const violations = results.violations.map((v: AxeCore.Result) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.map((n: AxeCore.NodeResult) => n.html),
    }));
    throw new Error(
      `Accessibility violations found:\n${JSON.stringify(violations, null, 2)}`
    );
  }
}

/**
 * Get axe results for a container
 */
export async function getA11yResults(container: Element): Promise<AxeResults> {
  return axe(container);
}

/**
 * Assert no violations exist in axe results
 */
export function assertNoViolations(results: AxeResults): void {
  if (results.violations.length > 0) {
    const violations = results.violations.map((v: AxeCore.Result) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.map((n: AxeCore.NodeResult) => n.html),
    }));
    throw new Error(
      `Accessibility violations found:\n${JSON.stringify(violations, null, 2)}`
    );
  }
}
