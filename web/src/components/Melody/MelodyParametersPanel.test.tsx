/**
 * Tests for MelodyParametersPanel Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import {
  MelodyParametersPanel,
  DEFAULT_PARAMETERS,
  type MelodyParametersPanelProps,
} from './MelodyParametersPanel';

describe('MelodyParametersPanel', () => {
  const defaultProps: MelodyParametersPanelProps = {
    parameters: DEFAULT_PARAMETERS,
    onParametersChange: vi.fn(),
    onRegenerate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders melody parameters panel', () => {
      render(<MelodyParametersPanel {...defaultProps} />);

      expect(screen.getByTestId('melody-parameters-panel')).toBeInTheDocument();
    });

    it('renders header', () => {
      render(<MelodyParametersPanel {...defaultProps} />);

      expect(screen.getByTestId('melody-parameters-panel-header')).toHaveTextContent(
        'Melody Parameters'
      );
    });

    it('renders all sections by default', () => {
      render(<MelodyParametersPanel {...defaultProps} />);

      expect(screen.getByTestId('melody-parameters-panel-key')).toBeInTheDocument();
      expect(screen.getByTestId('melody-parameters-panel-mode')).toBeInTheDocument();
      expect(screen.getByTestId('melody-parameters-panel-tempo')).toBeInTheDocument();
      expect(screen.getByTestId('melody-parameters-panel-range')).toBeInTheDocument();
      expect(screen.getByTestId('melody-parameters-panel-style')).toBeInTheDocument();
      expect(screen.getByTestId('melody-parameters-panel-regenerate')).toBeInTheDocument();
    });

    it('displays current parameter values', () => {
      const params = {
        ...DEFAULT_PARAMETERS,
        key: 'G' as const,
        mode: 'minor' as const,
        tempo: 120,
      };
      render(<MelodyParametersPanel {...defaultProps} parameters={params} />);

      expect(screen.getByTestId('melody-parameters-panel-key-current')).toHaveTextContent(
        'G Major'
      );
      expect(screen.getByTestId('melody-parameters-panel-mode-current')).toHaveTextContent(
        'Minor'
      );
      expect(screen.getByTestId('melody-parameters-panel-tempo-value')).toHaveTextContent(
        '120 BPM'
      );
    });

    it('hides sections based on hideSections prop', () => {
      render(
        <MelodyParametersPanel {...defaultProps} hideSections={['key', 'mode', 'range']} />
      );

      expect(screen.queryByTestId('melody-parameters-panel-key')).not.toBeInTheDocument();
      expect(screen.queryByTestId('melody-parameters-panel-mode')).not.toBeInTheDocument();
      expect(screen.queryByTestId('melody-parameters-panel-range')).not.toBeInTheDocument();
      expect(screen.getByTestId('melody-parameters-panel-tempo')).toBeInTheDocument();
      expect(screen.getByTestId('melody-parameters-panel-style')).toBeInTheDocument();
    });
  });

  describe('key changes', () => {
    it('calls onParametersChange when key changes', () => {
      const onParametersChange = vi.fn();
      render(
        <MelodyParametersPanel
          {...defaultProps}
          onParametersChange={onParametersChange}
        />
      );

      const select = screen.getByTestId('melody-parameters-panel-key-select');
      fireEvent.change(select, { target: { value: 'G' } });

      expect(onParametersChange).toHaveBeenCalledWith({ key: 'G' });
    });
  });

  describe('mode changes', () => {
    it('calls onParametersChange when mode changes', () => {
      const onParametersChange = vi.fn();
      render(
        <MelodyParametersPanel
          {...defaultProps}
          onParametersChange={onParametersChange}
        />
      );

      fireEvent.click(screen.getByTestId('melody-parameters-panel-mode-minor'));

      expect(onParametersChange).toHaveBeenCalledWith({ mode: 'minor' });
    });
  });

  describe('tempo changes', () => {
    it('calls onParametersChange when tempo changes', () => {
      const onParametersChange = vi.fn();
      render(
        <MelodyParametersPanel
          {...defaultProps}
          onParametersChange={onParametersChange}
        />
      );

      const slider = screen.getByTestId('melody-parameters-panel-tempo-slider');
      fireEvent.change(slider, { target: { value: '150' } });

      expect(onParametersChange).toHaveBeenCalledWith({ tempo: 150 });
    });
  });

  describe('range changes', () => {
    it('calls onParametersChange when range low changes', () => {
      const onParametersChange = vi.fn();
      render(
        <MelodyParametersPanel
          {...defaultProps}
          onParametersChange={onParametersChange}
        />
      );

      const slider = screen.getByTestId('melody-parameters-panel-range-low');
      fireEvent.change(slider, { target: { value: '-5' } });

      expect(onParametersChange).toHaveBeenCalledWith({
        rangeLow: expect.objectContaining({ note: expect.any(String), octave: expect.any(Number) }),
      });
    });

    it('calls onParametersChange when range high changes', () => {
      const onParametersChange = vi.fn();
      render(
        <MelodyParametersPanel
          {...defaultProps}
          onParametersChange={onParametersChange}
        />
      );

      const slider = screen.getByTestId('melody-parameters-panel-range-high');
      fireEvent.change(slider, { target: { value: '10' } });

      expect(onParametersChange).toHaveBeenCalledWith({
        rangeHigh: expect.objectContaining({ note: expect.any(String), octave: expect.any(Number) }),
      });
    });
  });

  describe('style preset changes', () => {
    it('calls onParametersChange when style preset changes', () => {
      const onParametersChange = vi.fn();
      render(
        <MelodyParametersPanel
          {...defaultProps}
          onParametersChange={onParametersChange}
        />
      );

      const select = screen.getByTestId('melody-parameters-panel-style-select');
      fireEvent.change(select, { target: { value: 'folk' } });

      // Should update stylePreset and apply preset defaults
      expect(onParametersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          stylePreset: 'folk',
          tempo: expect.any(Number),
          timeSignature: expect.any(String),
        })
      );
    });

    it('calls onParametersChange with null when selecting Custom', () => {
      const onParametersChange = vi.fn();
      render(
        <MelodyParametersPanel
          {...defaultProps}
          parameters={{ ...DEFAULT_PARAMETERS, stylePreset: 'folk' }}
          onParametersChange={onParametersChange}
        />
      );

      const select = screen.getByTestId('melody-parameters-panel-style-select');
      fireEvent.change(select, { target: { value: '' } });

      expect(onParametersChange).toHaveBeenCalledWith({ stylePreset: null });
    });
  });

  describe('regenerate button', () => {
    it('calls onRegenerate when button clicked', () => {
      const onRegenerate = vi.fn();
      render(
        <MelodyParametersPanel {...defaultProps} onRegenerate={onRegenerate} />
      );

      fireEvent.click(screen.getByTestId('melody-parameters-panel-regenerate-button'));

      expect(onRegenerate).toHaveBeenCalledTimes(1);
    });

    it('shows "Generate Melody" when no melody exists', () => {
      render(<MelodyParametersPanel {...defaultProps} hasMelody={false} />);

      expect(screen.getByTestId('melody-parameters-panel-regenerate-label')).toHaveTextContent(
        'Generate Melody'
      );
    });

    it('shows "Regenerate Melody" when melody exists and no changes', () => {
      render(<MelodyParametersPanel {...defaultProps} hasMelody={true} />);

      expect(screen.getByTestId('melody-parameters-panel-regenerate-label')).toHaveTextContent(
        'Regenerate Melody'
      );
    });

    it('shows "Apply Changes" when melody exists and parameters changed', async () => {
      render(<MelodyParametersPanel {...defaultProps} hasMelody={true} />);

      // Change a parameter
      const slider = screen.getByTestId('melody-parameters-panel-tempo-slider');
      fireEvent.change(slider, { target: { value: '150' } });

      await waitFor(() => {
        expect(screen.getByTestId('melody-parameters-panel-regenerate-label')).toHaveTextContent(
          'Apply Changes'
        );
      });
    });

    it('shows changes indicator when parameters changed', async () => {
      render(<MelodyParametersPanel {...defaultProps} hasMelody={true} />);

      // Change a parameter
      const slider = screen.getByTestId('melody-parameters-panel-tempo-slider');
      fireEvent.change(slider, { target: { value: '150' } });

      await waitFor(() => {
        expect(screen.getByTestId('melody-parameters-panel-changes-indicator')).toBeInTheDocument();
      });
    });

    it('shows generating state', () => {
      render(<MelodyParametersPanel {...defaultProps} isGenerating={true} />);

      expect(screen.getByTestId('melody-parameters-panel-regenerate-label')).toHaveTextContent(
        'Generating...'
      );
    });

    it('shows error message', () => {
      render(<MelodyParametersPanel {...defaultProps} error="Generation failed" />);

      expect(screen.getByTestId('melody-parameters-panel-regenerate-error')).toHaveTextContent(
        'Generation failed'
      );
    });
  });

  describe('disabled state', () => {
    it('disables all controls when disabled', () => {
      render(<MelodyParametersPanel {...defaultProps} disabled />);

      expect(screen.getByTestId('melody-parameters-panel-key-select')).toBeDisabled();
      expect(screen.getByTestId('melody-parameters-panel-mode-major')).toBeDisabled();
      expect(screen.getByTestId('melody-parameters-panel-tempo-slider')).toBeDisabled();
      expect(screen.getByTestId('melody-parameters-panel-range-low')).toBeDisabled();
      expect(screen.getByTestId('melody-parameters-panel-style-select')).toBeDisabled();
      expect(screen.getByTestId('melody-parameters-panel-regenerate-button')).toBeDisabled();
    });

    it('disables all controls when generating', () => {
      render(<MelodyParametersPanel {...defaultProps} isGenerating />);

      expect(screen.getByTestId('melody-parameters-panel-key-select')).toBeDisabled();
      expect(screen.getByTestId('melody-parameters-panel-mode-major')).toBeDisabled();
      expect(screen.getByTestId('melody-parameters-panel-tempo-slider')).toBeDisabled();
      expect(screen.getByTestId('melody-parameters-panel-range-low')).toBeDisabled();
      expect(screen.getByTestId('melody-parameters-panel-style-select')).toBeDisabled();
    });
  });

  describe('custom styling', () => {
    it('applies custom className', () => {
      render(<MelodyParametersPanel {...defaultProps} className="custom-class" />);

      expect(screen.getByTestId('melody-parameters-panel')).toHaveClass('custom-class');
    });

    it('applies custom testId', () => {
      render(<MelodyParametersPanel {...defaultProps} testId="custom-panel" />);

      expect(screen.getByTestId('custom-panel')).toBeInTheDocument();
      expect(screen.getByTestId('custom-panel-key')).toBeInTheDocument();
    });
  });
});
