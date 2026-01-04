/**
 * NotationDisplay Component
 *
 * Renders ABC notation as SVG sheet music using abcjs.
 * Supports responsive scaling and note highlighting during playback.
 */

import { useLayoutEffect, useRef, useCallback, useState } from 'react';
import {
  renderABC,
  type RenderOptions,
  type RenderResult,
} from '@/lib/music/abcRenderer';
import './Notation.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[NotationDisplay] ${message}`, ...args);
  }
};

/**
 * Props for NotationDisplay component
 */
export interface NotationDisplayProps {
  /** ABC notation string to render */
  abc: string;
  /** Optional unique ID for the container (auto-generated if not provided) */
  id?: string;
  /** Whether to make the notation responsive to container width */
  responsive?: boolean;
  /** Scale factor for the notation (default: 1) */
  scale?: number;
  /** Custom CSS class name */
  className?: string;
  /** Callback when a note is clicked */
  onNoteClick?: (noteData: NoteClickData) => void;
  /** Callback when rendering completes */
  onRenderComplete?: (result: RenderResult) => void;
  /** Callback when rendering fails */
  onRenderError?: (error: string) => void;
  /** Custom styling for the container */
  style?: React.CSSProperties;
  /** Staff width override (pixels, default: auto) */
  staffWidth?: number;
  /** Padding around the notation */
  padding?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}

/**
 * Data passed to note click callback
 */
export interface NoteClickData {
  /** The ABC element that was clicked */
  element: unknown;
  /** Tune number in multi-tune files */
  tuneNumber: number;
  /** CSS classes on the clicked element */
  classes: string;
}

/**
 * Counter for generating unique IDs
 */
let idCounter = 0;

/**
 * Generate a unique ID for the notation container
 */
function generateId(): string {
  return `notation-display-${++idCounter}`;
}

/**
 * NotationDisplay renders ABC notation as SVG sheet music.
 *
 * Features:
 * - Renders ABC notation to SVG
 * - Responsive scaling option
 * - Click handlers for notes
 * - CSS class injection for styling
 *
 * @example
 * ```tsx
 * <NotationDisplay
 *   abc={`X:1\nT:Simple\nM:4/4\nK:C\nCDEF|GABc|`}
 *   responsive
 *   onNoteClick={(data) => console.log('Clicked:', data)}
 * />
 * ```
 */
export function NotationDisplay({
  abc,
  id,
  responsive = true,
  scale = 1,
  className = '',
  onNoteClick,
  onRenderComplete,
  onRenderError,
  style,
  staffWidth,
  padding,
}: NotationDisplayProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerId] = useState(() => id ?? generateId());

  // Handle note click events
  const handleNoteClick = useCallback(
    (
      abcElem: unknown,
      tuneNumber: number,
      classes: string,
    ) => {
      log('Note clicked:', { tuneNumber, classes });

      if (onNoteClick) {
        onNoteClick({
          element: abcElem,
          tuneNumber,
          classes,
        });
      }
    },
    [onNoteClick]
  );

  // Use useLayoutEffect to render synchronously after DOM is ready
  // This is appropriate since abcjs directly manipulates the DOM
  useLayoutEffect(() => {
    if (!abc || !containerRef.current) {
      log('Skipping render: no ABC or container');
      return;
    }

    log('Rendering ABC notation...');

    // Build render options
    const options: RenderOptions = {
      responsive: responsive ? 'resize' : undefined,
      scale,
      add_classes: true,
      clickListener: onNoteClick ? handleNoteClick : undefined,
    };

    // Add optional parameters
    if (staffWidth !== undefined) {
      options.staffwidth = staffWidth;
    }
    if (padding?.top !== undefined) {
      options.paddingtop = padding.top;
    }
    if (padding?.bottom !== undefined) {
      options.paddingbottom = padding.bottom;
    }
    if (padding?.left !== undefined) {
      options.paddingleft = padding.left;
    }
    if (padding?.right !== undefined) {
      options.paddingright = padding.right;
    }

    // Render the notation
    const result = renderABC(abc, containerId, options);

    if (result.success) {
      log('Render successful, tune count:', result.tuneObjects.length);
      onRenderComplete?.(result);
    } else {
      log('Render failed:', result.error);
      onRenderError?.(result.error ?? 'Unknown rendering error');
    }
  }, [
    abc,
    containerId,
    responsive,
    scale,
    staffWidth,
    padding,
    handleNoteClick,
    onNoteClick,
    onRenderComplete,
    onRenderError,
  ]);

  // Base container styles
  const containerStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '100px',
    ...style,
  };

  return (
    <div
      ref={containerRef}
      id={containerId}
      className={`notation-display ${className}`.trim()}
      style={containerStyle}
      data-testid="notation-display"
      aria-label="Music notation"
      role="img"
    >
      {/* abcjs will inject the SVG here */}
    </div>
  );
}

export default NotationDisplay;
