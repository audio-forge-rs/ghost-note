/**
 * Ghost Note Main Application
 *
 * Root component that sets up the application layout and routing.
 *
 * @module App
 */

import { useState, useEffect } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { AppShell, type NavigationView } from '@/components/Layout';
import { EmptyState } from '@/components/Common';
import { PoemInput } from '@/components/PoemInput';
import './App.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[App] ${message}`, ...args);
  }
};

/**
 * View configuration for each navigation item
 */
interface ViewConfig {
  id: NavigationView;
  title: string;
  description: string;
}

const VIEW_CONFIGS: Record<NavigationView, ViewConfig> = {
  'poem-input': {
    id: 'poem-input',
    title: 'No Poem Entered',
    description: 'Paste or type your poem to get started.',
  },
  analysis: {
    id: 'analysis',
    title: 'No Analysis Available',
    description: 'Enter a poem first to see its analysis.',
  },
  'lyrics-editor': {
    id: 'lyrics-editor',
    title: 'No Lyrics to Edit',
    description: 'Complete the analysis step to start editing lyrics.',
  },
  melody: {
    id: 'melody',
    title: 'No Melody Generated',
    description: 'Edit your lyrics first, then generate a melody.',
  },
  recording: {
    id: 'recording',
    title: 'Ready to Record',
    description: 'Generate a melody first, then record your performance.',
  },
};

/**
 * Renders the appropriate component for each navigation view.
 * Falls back to EmptyState placeholder for views not yet implemented.
 */
function ViewContent({
  view,
  onNavigate,
}: {
  view: NavigationView;
  onNavigate: (view: NavigationView) => void;
}): React.ReactElement {
  const config = VIEW_CONFIGS[view];

  log('Rendering view content for:', view);

  switch (view) {
    case 'poem-input':
      return (
        <PoemInput
          onAnalyze={() => {
            log('Analyze triggered, navigating to analysis view');
            onNavigate('analysis');
          }}
          showStats
        />
      );

    case 'analysis':
    case 'lyrics-editor':
    case 'melody':
    case 'recording':
    default:
      return (
        <EmptyState
          title={config.title}
          description={config.description}
          variant="centered"
          testId={`view-${view}`}
        />
      );
  }
}

/**
 * Main Application component.
 *
 * Sets up the app shell with navigation and manages the active view state.
 */
function App(): React.ReactElement {
  const [activeView, setActiveView] = useState<NavigationView>('poem-input');

  log('App rendering with activeView:', activeView);

  // Initialize theme on mount - only runs once
  useEffect(() => {
    // Re-apply theme to ensure it's set correctly after hydration
    const currentTheme = useThemeStore.getState().theme;
    if (currentTheme) {
      log('Initializing theme:', currentTheme);
      useThemeStore.getState().setTheme(currentTheme);
    }
  }, []);

  const handleNavigate = (view: NavigationView): void => {
    log('Navigating to:', view);
    setActiveView(view);
  };

  return (
    <AppShell activeView={activeView} onNavigate={handleNavigate}>
      <ViewContent view={activeView} onNavigate={handleNavigate} />
    </AppShell>
  );
}

export default App;
