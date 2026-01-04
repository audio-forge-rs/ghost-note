/**
 * Tests for MeterDisplay Component
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MeterDisplay } from './MeterDisplay';
import { type MeterAnalysis } from '@/types/analysis';

describe('MeterDisplay', () => {
  afterEach(() => {
    cleanup();
  });

  const createMockMeter = (): MeterAnalysis => ({
    pattern: '0101010101',
    detectedMeter: 'iambic_pentameter',
    footType: 'iamb',
    feetPerLine: 5,
    confidence: 0.85,
    deviations: [2, 7],
  });

  describe('rendering', () => {
    it('renders the meter display container', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByTestId('meter-display')).toBeInTheDocument();
    });

    it('renders title', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText('Meter Analysis')).toBeInTheDocument();
    });

    it('displays detected meter name', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText('iambic_pentameter')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} className="custom-class" />);
      expect(screen.getByTestId('meter-display')).toHaveClass('custom-class');
    });
  });

  describe('meter card content', () => {
    it('renders meter card', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByTestId('meter-card')).toBeInTheDocument();
    });

    it('displays foot type section', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText('Foot Type')).toBeInTheDocument();
      expect(screen.getByText('Iamb')).toBeInTheDocument();
    });

    it('displays foot pattern symbols', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      // Iamb pattern is ˘ ˈ (unstressed followed by stressed)
      const patternElement = screen.getByLabelText(/unstressed followed by stressed/i);
      expect(patternElement).toBeInTheDocument();
    });

    it('displays feet per line', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText('Feet Per Line')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('(pentameter)')).toBeInTheDocument();
    });
  });

  describe('regularity gauge', () => {
    it('displays regularity section', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText('Regularity')).toBeInTheDocument();
    });

    it('displays regularity percentage', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText('90%')).toBeInTheDocument();
    });

    it('has progressbar role for regularity gauge', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      const progressbars = screen.getAllByRole('progressbar');
      const regularityBar = progressbars.find(
        (bar) => bar.getAttribute('aria-label') === 'Meter regularity'
      );
      expect(regularityBar).toBeInTheDocument();
      expect(regularityBar).toHaveAttribute('aria-valuenow', '90');
    });

    it('displays high regularity label', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText('Highly consistent meter')).toBeInTheDocument();
    });

    it('displays medium regularity label', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.6} />);
      expect(screen.getByText('Moderately regular meter')).toBeInTheDocument();
    });

    it('displays low regularity label', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.3} />);
      expect(screen.getByText('Irregular or varied meter')).toBeInTheDocument();
    });
  });

  describe('confidence gauge', () => {
    it('displays confidence section', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText('Detection Confidence')).toBeInTheDocument();
    });

    it('displays confidence percentage', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('has progressbar role for confidence gauge', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      const progressbars = screen.getAllByRole('progressbar');
      const confidenceBar = progressbars.find(
        (bar) => bar.getAttribute('aria-label') === 'Detection confidence'
      );
      expect(confidenceBar).toBeInTheDocument();
      expect(confidenceBar).toHaveAttribute('aria-valuenow', '85');
    });
  });

  describe('pattern display', () => {
    it('displays stress pattern section', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText('Stress Pattern')).toBeInTheDocument();
    });

    it('renders pattern characters', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      // Pattern has 10 characters
      const patternArea = screen.getByLabelText('Overall stress pattern');
      expect(patternArea).toBeInTheDocument();
    });
  });

  describe('summary', () => {
    it('displays deviation count', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText(/Deviations:/)).toBeInTheDocument();
    });

    it('displays deviation positions when present', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText(/at positions: 2, 7/)).toBeInTheDocument();
    });

    it('does not show positions when no deviations', () => {
      const meter: MeterAnalysis = {
        ...createMockMeter(),
        deviations: [],
      };
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.queryByText(/at positions:/)).not.toBeInTheDocument();
    });
  });

  describe('foot type variations', () => {
    it('displays trochee correctly', () => {
      const meter: MeterAnalysis = {
        ...createMockMeter(),
        footType: 'trochee',
        detectedMeter: 'trochaic_tetrameter',
      };
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText('Trochee')).toBeInTheDocument();
    });

    it('displays anapest correctly', () => {
      const meter: MeterAnalysis = {
        ...createMockMeter(),
        footType: 'anapest',
        detectedMeter: 'anapestic_trimeter',
      };
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText('Anapest')).toBeInTheDocument();
    });

    it('displays dactyl correctly', () => {
      const meter: MeterAnalysis = {
        ...createMockMeter(),
        footType: 'dactyl',
        detectedMeter: 'dactylic_hexameter',
      };
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText('Dactyl')).toBeInTheDocument();
    });

    it('displays spondee correctly', () => {
      const meter: MeterAnalysis = {
        ...createMockMeter(),
        footType: 'spondee',
        detectedMeter: 'spondaic',
      };
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText('Spondee')).toBeInTheDocument();
    });

    it('displays unknown correctly', () => {
      const meter: MeterAnalysis = {
        ...createMockMeter(),
        footType: 'unknown',
        detectedMeter: 'irregular',
      };
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  describe('feet count descriptors', () => {
    it('displays monometer for 1 foot', () => {
      const meter: MeterAnalysis = {
        ...createMockMeter(),
        feetPerLine: 1,
      };
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText('(monometer)')).toBeInTheDocument();
    });

    it('displays dimeter for 2 feet', () => {
      const meter: MeterAnalysis = {
        ...createMockMeter(),
        feetPerLine: 2,
      };
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText('(dimeter)')).toBeInTheDocument();
    });

    it('displays tetrameter for 4 feet', () => {
      const meter: MeterAnalysis = {
        ...createMockMeter(),
        feetPerLine: 4,
      };
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText('(tetrameter)')).toBeInTheDocument();
    });

    it('displays hexameter for 6 feet', () => {
      const meter: MeterAnalysis = {
        ...createMockMeter(),
        feetPerLine: 6,
      };
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByText('(hexameter)')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible region role', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      expect(screen.getByRole('region', { name: /metrical analysis/i })).toBeInTheDocument();
    });

    it('gauges have progressbar role with proper values', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      const progressbars = screen.getAllByRole('progressbar');
      expect(progressbars.length).toBe(2);
      progressbars.forEach((bar) => {
        expect(bar).toHaveAttribute('aria-valuemin', '0');
        expect(bar).toHaveAttribute('aria-valuemax', '100');
      });
    });

    it('summary has aria-live for dynamic updates', () => {
      const meter = createMockMeter();
      render(<MeterDisplay meter={meter} regularity={0.9} />);
      const summary = screen.getByText(/Deviations:/i).closest('div');
      expect(summary).toHaveAttribute('aria-live', 'polite');
    });
  });
});
