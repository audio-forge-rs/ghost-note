/**
 * View Skeletons
 *
 * Content-aware skeleton loading states for different views.
 * These provide a better perceived performance than generic spinners
 * by showing the expected layout structure while content loads.
 *
 * @module components/Common/ViewSkeletons
 */

import type { ReactElement } from 'react';
import { Skeleton, SkeletonText, SkeletonCard } from './Skeleton';
import './ViewSkeletons.css';

/**
 * Analysis Panel skeleton - mimics the structure of the AnalysisPanel component
 */
export function AnalysisPanelSkeleton(): ReactElement {
  return (
    <div className="view-skeleton analysis-skeleton" data-testid="analysis-panel-skeleton">
      {/* Header section */}
      <div className="analysis-skeleton__header">
        <Skeleton variant="text" width="40%" height={28} ariaLabel="Loading analysis title" />
        <Skeleton variant="rounded" width={120} height={32} ariaLabel="Loading analysis status" />
      </div>

      {/* Summary cards row */}
      <div className="analysis-skeleton__summary">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="analysis-skeleton__card">
            <Skeleton variant="text" width="60%" height={14} ariaLabel={`Loading metric ${i} label`} />
            <Skeleton variant="text" width="40%" height={24} ariaLabel={`Loading metric ${i} value`} />
          </div>
        ))}
      </div>

      {/* Meter display section */}
      <div className="analysis-skeleton__meter">
        <Skeleton variant="text" width="30%" height={18} ariaLabel="Loading meter label" />
        <Skeleton variant="rounded" width="100%" height={60} ariaLabel="Loading meter visualization" />
      </div>

      {/* Analysis details */}
      <div className="analysis-skeleton__details">
        <SkeletonCard lines={4} testId="analysis-skeleton-card" />
      </div>
    </div>
  );
}

/**
 * Lyric Editor skeleton - mimics the structure of the LyricEditor component
 */
export function LyricEditorSkeleton(): ReactElement {
  return (
    <div className="view-skeleton editor-skeleton" data-testid="lyric-editor-skeleton">
      {/* Toolbar */}
      <div className="editor-skeleton__toolbar">
        <div className="editor-skeleton__toolbar-group">
          <Skeleton variant="rounded" width={80} height={32} ariaLabel="Loading toolbar button" />
          <Skeleton variant="rounded" width={80} height={32} ariaLabel="Loading toolbar button" />
          <Skeleton variant="rounded" width={80} height={32} ariaLabel="Loading toolbar button" />
        </div>
        <Skeleton variant="rounded" width={100} height={32} ariaLabel="Loading toolbar action" />
      </div>

      {/* Editor area */}
      <div className="editor-skeleton__content">
        <div className="editor-skeleton__lines">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="editor-skeleton__line">
              <Skeleton variant="text" width={20} height={16} ariaLabel={`Line ${i} number`} />
              <Skeleton variant="text" width={`${60 + Math.random() * 30}%`} height={20} ariaLabel={`Line ${i} content`} />
            </div>
          ))}
        </div>
      </div>

      {/* Suggestion panel placeholder */}
      <div className="editor-skeleton__suggestions">
        <Skeleton variant="text" width="30%" height={18} ariaLabel="Loading suggestions title" />
        <SkeletonText lines={3} testId="editor-suggestions-skeleton" />
      </div>
    </div>
  );
}

/**
 * Melody view skeleton - mimics the structure of the NotationDisplay and PlaybackContainer
 */
export function MelodySkeleton(): ReactElement {
  return (
    <div className="view-skeleton melody-skeleton" data-testid="melody-skeleton">
      {/* Sheet music area */}
      <div className="melody-skeleton__notation">
        <div className="melody-skeleton__staff">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={80} ariaLabel={`Staff line ${i}`} />
          ))}
        </div>
      </div>

      {/* Playback controls */}
      <div className="melody-skeleton__controls">
        <div className="melody-skeleton__transport">
          <Skeleton variant="circular" width={48} height={48} ariaLabel="Loading play button" />
          <Skeleton variant="circular" width={40} height={40} ariaLabel="Loading stop button" />
          <Skeleton variant="rounded" width="60%" height={8} ariaLabel="Loading progress bar" />
          <Skeleton variant="text" width={60} height={16} ariaLabel="Loading time display" />
        </div>
        <div className="melody-skeleton__options">
          <Skeleton variant="rounded" width={100} height={32} ariaLabel="Loading tempo control" />
          <Skeleton variant="rounded" width={80} height={32} ariaLabel="Loading key control" />
          <Skeleton variant="rounded" width={60} height={32} ariaLabel="Loading loop toggle" />
        </div>
      </div>
    </div>
  );
}

/**
 * Recording view skeleton - mimics the structure of the RecordingStudio component
 */
export function RecordingSkeleton(): ReactElement {
  return (
    <div className="view-skeleton recording-skeleton" data-testid="recording-skeleton">
      {/* Header */}
      <Skeleton variant="text" width="50%" height={24} ariaLabel="Loading recording title" />

      {/* Microphone select */}
      <div className="recording-skeleton__device">
        <Skeleton variant="text" width="25%" height={16} ariaLabel="Loading device label" />
        <Skeleton variant="rounded" width="100%" height={40} ariaLabel="Loading device selector" />
      </div>

      {/* Level meter */}
      <div className="recording-skeleton__meter">
        <Skeleton variant="text" width="20%" height={16} ariaLabel="Loading meter label" />
        <Skeleton variant="rounded" width="100%" height={24} ariaLabel="Loading audio level meter" />
      </div>

      {/* Recording controls */}
      <div className="recording-skeleton__controls">
        <Skeleton variant="circular" width={64} height={64} ariaLabel="Loading record button" />
      </div>

      {/* Recording list placeholder */}
      <div className="recording-skeleton__list">
        <Skeleton variant="text" width="30%" height={18} ariaLabel="Loading recordings title" />
        {[1, 2].map((i) => (
          <div key={i} className="recording-skeleton__item">
            <Skeleton variant="rounded" width={32} height={32} ariaLabel={`Recording ${i} icon`} />
            <Skeleton variant="text" width="60%" height={16} ariaLabel={`Recording ${i} name`} />
            <Skeleton variant="text" width={60} height={14} ariaLabel={`Recording ${i} duration`} />
          </div>
        ))}
      </div>
    </div>
  );
}
