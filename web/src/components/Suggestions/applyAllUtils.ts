/**
 * Apply All Button Utilities
 *
 * Utility functions for batch operation configuration.
 *
 * @module components/Suggestions/applyAllUtils
 */

import { createElement, type ReactElement } from 'react';

/**
 * Type of batch operation
 */
export type BatchOperationType = 'accept' | 'reject' | 'reset';

/**
 * Configuration for each operation type
 */
export interface OperationConfig {
  label: string;
  icon: ReactElement;
  description: string;
}

/**
 * Icons for each operation type
 */
const CheckAllIcon = (): ReactElement =>
  createElement('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    'aria-hidden': 'true',
  }, [
    createElement('path', { key: '1', d: 'M9 11l3 3L22 4' }),
    createElement('path', { key: '2', d: 'M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11' }),
  ]);

const RejectAllIcon = (): ReactElement =>
  createElement('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    'aria-hidden': 'true',
  }, [
    createElement('rect', { key: '1', x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' }),
    createElement('line', { key: '2', x1: '9', y1: '9', x2: '15', y2: '15' }),
    createElement('line', { key: '3', x1: '15', y1: '9', x2: '9', y2: '15' }),
  ]);

const ResetAllIcon = (): ReactElement =>
  createElement('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    'aria-hidden': 'true',
  }, [
    createElement('path', { key: '1', d: 'M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8' }),
    createElement('path', { key: '2', d: 'M3 3v5h5' }),
  ]);

const OPERATION_CONFIG: Record<BatchOperationType, OperationConfig> = {
  accept: {
    label: 'Accept All',
    icon: CheckAllIcon(),
    description: 'Accept all pending suggestions',
  },
  reject: {
    label: 'Reject All',
    icon: RejectAllIcon(),
    description: 'Reject all pending suggestions',
  },
  reset: {
    label: 'Reset All',
    icon: ResetAllIcon(),
    description: 'Reset all suggestions to pending',
  },
};

/**
 * Get the operation configuration for external use
 */
export function getOperationConfig(operation: BatchOperationType): OperationConfig {
  return OPERATION_CONFIG[operation];
}
