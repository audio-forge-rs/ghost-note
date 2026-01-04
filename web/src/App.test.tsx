/**
 * Tests for App Component
 *
 * Example test demonstrating Vitest with React Testing Library
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import App from './App';
import { useUIStore } from '@/stores/useUIStore';

// Mock the stores
vi.mock('@/stores/useUIStore', () => ({
  useUIStore: Object.assign(
    vi.fn(),
    {
      getState: vi.fn(() => ({
        theme: 'dark',
        setTheme: vi.fn(),
      })),
    }
  ),
}));

// Mock child components
vi.mock('@/components/Layout', () => ({
  AppShell: ({ children, activeView, onNavigate }: {
    children: React.ReactNode;
    activeView: string;
    onNavigate: (view: string) => void;
  }) => (
    <div data-testid="app-shell" data-active-view={activeView}>
      <nav data-testid="navigation">
        <button data-testid="nav-poem-input" onClick={() => onNavigate('poem-input')}>Poem Input</button>
        <button data-testid="nav-analysis" onClick={() => onNavigate('analysis')}>Analysis</button>
        <button data-testid="nav-lyrics-editor" onClick={() => onNavigate('lyrics-editor')}>Lyrics Editor</button>
        <button data-testid="nav-melody" onClick={() => onNavigate('melody')}>Melody</button>
        <button data-testid="nav-recording" onClick={() => onNavigate('recording')}>Recording</button>
      </nav>
      <main data-testid="main-content">{children}</main>
    </div>
  ),
}));

vi.mock('@/components/Common', () => ({
  EmptyState: ({ title, description, testId }: { title: string; description: string; testId?: string }) => (
    <div data-testid={testId}>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
}));

interface MockUIState {
  theme: 'light' | 'dark' | 'system';
  setTheme: ReturnType<typeof vi.fn>;
}

describe('App', () => {
  const mockSetTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector?: (state: MockUIState) => unknown) => {
      const state: MockUIState = { theme: 'dark', setTheme: mockSetTheme };
      return selector ? selector(state) : state;
    });
    (useUIStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the app shell', () => {
      render(<App />);
      expect(screen.getByTestId('app-shell')).toBeInTheDocument();
    });

    it('renders with poem-input as the default view', () => {
      render(<App />);
      expect(screen.getByTestId('app-shell')).toHaveAttribute('data-active-view', 'poem-input');
    });

    it('renders the default view placeholder', () => {
      render(<App />);
      expect(screen.getByTestId('view-poem-input')).toBeInTheDocument();
      expect(screen.getByText('No Poem Entered')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('navigates to analysis view when clicked', () => {
      render(<App />);

      fireEvent.click(screen.getByTestId('nav-analysis'));

      expect(screen.getByTestId('app-shell')).toHaveAttribute('data-active-view', 'analysis');
      expect(screen.getByTestId('view-analysis')).toBeInTheDocument();
      expect(screen.getByText('No Analysis Available')).toBeInTheDocument();
    });

    it('navigates to lyrics-editor view when clicked', () => {
      render(<App />);

      fireEvent.click(screen.getByTestId('nav-lyrics-editor'));

      expect(screen.getByTestId('app-shell')).toHaveAttribute('data-active-view', 'lyrics-editor');
      expect(screen.getByTestId('view-lyrics-editor')).toBeInTheDocument();
      expect(screen.getByText('No Lyrics to Edit')).toBeInTheDocument();
    });

    it('navigates to melody view when clicked', () => {
      render(<App />);

      fireEvent.click(screen.getByTestId('nav-melody'));

      expect(screen.getByTestId('app-shell')).toHaveAttribute('data-active-view', 'melody');
      expect(screen.getByTestId('view-melody')).toBeInTheDocument();
      expect(screen.getByText('No Melody Generated')).toBeInTheDocument();
    });

    it('navigates to recording view when clicked', () => {
      render(<App />);

      fireEvent.click(screen.getByTestId('nav-recording'));

      expect(screen.getByTestId('app-shell')).toHaveAttribute('data-active-view', 'recording');
      expect(screen.getByTestId('view-recording')).toBeInTheDocument();
      expect(screen.getByText('Ready to Record')).toBeInTheDocument();
    });

    it('can navigate back to poem-input view', () => {
      render(<App />);

      // Navigate away
      fireEvent.click(screen.getByTestId('nav-analysis'));
      expect(screen.getByTestId('app-shell')).toHaveAttribute('data-active-view', 'analysis');

      // Navigate back
      fireEvent.click(screen.getByTestId('nav-poem-input'));
      expect(screen.getByTestId('app-shell')).toHaveAttribute('data-active-view', 'poem-input');
    });
  });

  describe('view placeholders', () => {
    it('displays correct title and description for poem-input view', () => {
      render(<App />);
      expect(screen.getByText('No Poem Entered')).toBeInTheDocument();
      expect(screen.getByText('Paste or type your poem to get started.')).toBeInTheDocument();
    });

    it('displays correct title and description for analysis view', () => {
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-analysis'));
      expect(screen.getByText('No Analysis Available')).toBeInTheDocument();
      expect(screen.getByText('Enter a poem first to see its analysis.')).toBeInTheDocument();
    });

    it('displays correct title and description for lyrics-editor view', () => {
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-lyrics-editor'));
      expect(screen.getByText('No Lyrics to Edit')).toBeInTheDocument();
      expect(screen.getByText('Complete the analysis step to start editing lyrics.')).toBeInTheDocument();
    });

    it('displays correct title and description for melody view', () => {
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-melody'));
      expect(screen.getByText('No Melody Generated')).toBeInTheDocument();
      expect(screen.getByText('Edit your lyrics first, then generate a melody.')).toBeInTheDocument();
    });

    it('displays correct title and description for recording view', () => {
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-recording'));
      expect(screen.getByText('Ready to Record')).toBeInTheDocument();
      expect(screen.getByText('Generate a melody first, then record your performance.')).toBeInTheDocument();
    });
  });

});
