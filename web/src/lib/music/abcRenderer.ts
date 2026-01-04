/**
 * ABC Renderer and Playback Module
 *
 * Provides ABC notation rendering to SVG and MIDI synthesis playback
 * using the abcjs library.
 *
 * @module abcRenderer
 */

import abcjs from 'abcjs';
import type { TuneObject, MidiBuffer, AbcVisualParams, ClickListener } from 'abcjs';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[abcRenderer] ${message}`, ...args);
  }
};

/**
 * Options for rendering ABC notation
 */
export interface RenderOptions {
  /** Whether to make the notation responsive */
  responsive?: 'resize' | undefined;
  /** Scale factor for the notation (default: 1) */
  scale?: number;
  /** Whether to add classes for note selection/styling */
  add_classes?: boolean;
  /** Staff width in pixels (default: auto) */
  staffwidth?: number;
  /** Padding around the notation */
  paddingtop?: number;
  paddingbottom?: number;
  paddingleft?: number;
  paddingright?: number;
  /** Callback when a note is clicked */
  clickListener?: ClickListener;
}

/**
 * Result from rendering ABC notation
 */
export interface RenderResult {
  /** The tune objects returned by abcjs */
  tuneObjects: TuneObject[];
  /** Whether rendering was successful */
  success: boolean;
  /** Error message if rendering failed */
  error?: string;
}

/**
 * State of the audio synth
 */
export type SynthState = 'uninitialized' | 'loading' | 'ready' | 'playing' | 'paused' | 'stopped' | 'error';

/**
 * Callback for synth state changes
 */
export type SynthStateCallback = (state: SynthState) => void;

/**
 * Callback for playback progress
 */
export type ProgressCallback = (currentBeat: number, totalBeats: number, lastMoment: number) => void;

/**
 * Callback for note events during playback
 */
export type NoteEventCallback = (event: { midiPitch: number; start: number; end: number } | null) => void;

/**
 * Configuration for the synth
 */
export interface SynthConfig {
  /** Tempo multiplier (1.0 = normal speed) */
  tempoMultiplier?: number;
  /** Volume (0-100) */
  volume?: number;
  /** Callback for state changes */
  onStateChange?: SynthStateCallback;
  /** Callback for playback progress */
  onProgress?: ProgressCallback;
  /** Callback for note events (for highlighting) */
  onNoteEvent?: NoteEventCallback;
}

/**
 * Manages ABC synth instance and playback state
 */
export class AbcSynth {
  private synth: MidiBuffer | null = null;
  private timingCallbacks: abcjs.TimingCallbacks | null = null;
  private currentTune: TuneObject | null = null;
  private state: SynthState = 'uninitialized';
  private config: SynthConfig;
  private audioContext: AudioContext | null = null;
  private cursorControl: CursorControl | null = null;

  constructor(config: SynthConfig = {}) {
    this.config = {
      tempoMultiplier: 1.0,
      volume: 100,
      ...config,
    };
    log('AbcSynth constructed with config:', this.config);
  }

  /**
   * Get the current synth state
   */
  getState(): SynthState {
    return this.state;
  }

  /**
   * Set the synth state and notify callback
   */
  private setState(newState: SynthState): void {
    log('State change:', this.state, '->', newState);
    this.state = newState;
    this.config.onStateChange?.(newState);
  }

  /**
   * Initialize the audio context and synth
   * Must be called after user interaction (browser autoplay policy)
   */
  async init(): Promise<boolean> {
    log('Initializing synth...');
    this.setState('loading');

    try {
      // Create audio context if needed
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
        log('Created AudioContext, sample rate:', this.audioContext.sampleRate);
      }

      // Resume audio context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        log('Resumed suspended AudioContext');
      }

      this.setState('ready');
      log('Synth initialized successfully');
      return true;
    } catch (error) {
      log('Failed to initialize synth:', error);
      this.setState('error');
      return false;
    }
  }

  /**
   * Load a tune for playback
   * @param tuneObject - The tune object from renderABC
   * @param elementId - Element ID for visual syncing (cursor/highlighting)
   */
  async load(tuneObject: TuneObject, elementId?: string): Promise<boolean> {
    log('Loading tune for playback...');

    if (this.state === 'uninitialized') {
      const initialized = await this.init();
      if (!initialized) {
        return false;
      }
    }

    this.setState('loading');
    this.currentTune = tuneObject;

    try {
      // Clean up previous cursor control
      if (this.cursorControl) {
        this.cursorControl.dispose();
        this.cursorControl = null;
      }

      // Clean up previous timing callbacks
      if (this.timingCallbacks) {
        this.timingCallbacks.stop();
        this.timingCallbacks = null;
      }

      // Create synth controller for visual sync
      if (elementId) {
        this.cursorControl = new CursorControl(elementId, this.config.onNoteEvent);

        // Set up TimingCallbacks for note highlighting
        this.timingCallbacks = new abcjs.TimingCallbacks(tuneObject, {
          eventCallback: (event) => {
            // Forward event to cursor control for highlighting
            if (this.cursorControl) {
              this.cursorControl.onEvent(event as NoteTimingEvent | null);
            }
            return undefined;
          },
          beatCallback: (beatNumber, totalBeats, totalTime) => {
            // Forward beat events
            if (this.cursorControl) {
              this.cursorControl.onBeat(beatNumber, totalBeats, totalTime);
            }
            // Notify progress callback
            this.config.onProgress?.(beatNumber, totalBeats, totalTime);
          },
        });
      }

      // Create synth using the CreateSynth constructor from abcjs.synth
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SynthClass = (abcjs.synth as any).CreateSynth;
      this.synth = new SynthClass() as MidiBuffer;

      // Initialize synth with the tune
      await this.synth.init({
        audioContext: this.audioContext!,
        visualObj: tuneObject,
      });

      // Prime the audio buffers
      await this.synth.prime();

      this.setState('ready');
      log('Tune loaded successfully');
      return true;
    } catch (error) {
      log('Failed to load tune:', error);
      this.setState('error');
      return false;
    }
  }

  /**
   * Start or resume playback
   */
  async play(): Promise<boolean> {
    log('Play requested, current state:', this.state);

    if (!this.synth || !this.currentTune) {
      log('Cannot play: no tune loaded');
      return false;
    }

    if (this.state === 'playing') {
      log('Already playing');
      return true;
    }

    try {
      // Resume audio context if needed
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Start playback
      this.synth.start();
      this.setState('playing');

      // Start timing callbacks for note highlighting
      this.timingCallbacks?.start();

      // Start cursor animation if available
      this.cursorControl?.start();

      log('Playback started');
      return true;
    } catch (error) {
      log('Failed to start playback:', error);
      this.setState('error');
      return false;
    }
  }

  /**
   * Pause playback
   */
  pause(): boolean {
    log('Pause requested');

    if (!this.synth || this.state !== 'playing') {
      return false;
    }

    this.synth.pause();
    this.timingCallbacks?.pause();
    this.setState('paused');
    this.cursorControl?.pause();
    log('Playback paused');
    return true;
  }

  /**
   * Resume playback after pause
   */
  resume(): boolean {
    log('Resume requested');

    if (!this.synth || this.state !== 'paused') {
      return false;
    }

    this.synth.resume();
    this.timingCallbacks?.start();
    this.setState('playing');
    this.cursorControl?.resume();
    log('Playback resumed');
    return true;
  }

  /**
   * Stop playback and reset to beginning
   */
  stop(): boolean {
    log('Stop requested');

    if (!this.synth) {
      return false;
    }

    this.synth.stop();
    this.timingCallbacks?.stop();
    this.timingCallbacks?.reset();
    this.setState('stopped');
    this.cursorControl?.stop();
    log('Playback stopped');
    return true;
  }

  /**
   * Set the tempo multiplier (1.0 = normal speed)
   */
  setTempo(multiplier: number): void {
    log('Setting tempo multiplier:', multiplier);
    this.config.tempoMultiplier = multiplier;

    if (this.synth) {
      // abcjs doesn't support tempo change during playback directly
      // We would need to reload the tune with the new tempo
      log('Note: Tempo change requires reloading tune to take effect');
    }
  }

  /**
   * Get the current tempo multiplier
   */
  getTempo(): number {
    return this.config.tempoMultiplier ?? 1.0;
  }

  /**
   * Set the volume (0-100)
   */
  setVolume(volume: number): void {
    log('Setting volume:', volume);
    this.config.volume = Math.max(0, Math.min(100, volume));
    // Volume control would need to be implemented via Web Audio API gain node
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    log('Disposing synth...');
    this.stop();
    this.synth = null;
    this.currentTune = null;

    // Clean up timing callbacks
    if (this.timingCallbacks) {
      this.timingCallbacks.stop();
      this.timingCallbacks = null;
    }

    // Clean up cursor control
    this.cursorControl?.dispose();
    this.cursorControl = null;

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch((e) => log('Error closing AudioContext:', e));
      this.audioContext = null;
    }

    this.setState('uninitialized');
    log('Synth disposed');
  }
}

/**
 * Note timing event from abcjs
 */
export interface NoteTimingEvent {
  /** Elements to highlight */
  elements?: SVGElement[][];
  /** Start position in milliseconds */
  milliseconds?: number;
  /** Left position for cursor */
  left?: number;
  /** Top position */
  top?: number;
  /** Height of the element */
  height?: number;
  /** MIDI pitches being played */
  midiPitches?: Array<{ pitch: number; start: number; duration: number }>;
}

/**
 * Controls cursor movement and note highlighting during playback.
 * Implements the CursorControl interface expected by abcjs TimingCallbacks.
 */
class CursorControl {
  private elementId: string;
  private cursor: SVGLineElement | null = null;
  private onNoteEvent?: NoteEventCallback;
  private animationFrameId: number | null = null;
  private svg: SVGSVGElement | null = null;
  private lastHighlightedElements: SVGElement[] = [];

  constructor(elementId: string, onNoteEvent?: NoteEventCallback) {
    this.elementId = elementId;
    this.onNoteEvent = onNoteEvent;
    this.initializeSvg();
  }

  private initializeSvg(): void {
    const container = document.getElementById(this.elementId);
    if (!container) {
      log('CursorControl: Container not found:', this.elementId);
      return;
    }

    this.svg = container.querySelector('svg');
    if (!this.svg) {
      log('CursorControl: SVG not found in container');
      return;
    }

    this.createCursor();
    log('CursorControl: Initialized');
  }

  private createCursor(): void {
    if (!this.svg) return;

    // Create cursor line
    this.cursor = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    this.cursor.setAttribute('class', 'abcjs-cursor');
    this.cursor.setAttribute('x1', '0');
    this.cursor.setAttribute('y1', '0');
    this.cursor.setAttribute('x2', '0');
    this.cursor.setAttribute('y2', '0');
    this.cursor.setAttribute('stroke', '#1e90ff');
    this.cursor.setAttribute('stroke-width', '2');
    this.cursor.style.display = 'none';

    this.svg.appendChild(this.cursor);
    log('CursorControl: Cursor created');
  }

  /**
   * Called when the audio is ready to play.
   * abcjs CursorControl interface method.
   */
  onReady(): void {
    log('CursorControl: onReady');
  }

  /**
   * Called when playback starts.
   * abcjs CursorControl interface method.
   */
  onStart(): void {
    if (this.cursor) {
      this.cursor.style.display = 'block';
    }
    log('CursorControl: onStart');
  }

  /**
   * Called when playback finishes.
   * abcjs CursorControl interface method.
   */
  onFinished(): void {
    this.clearHighlighting();
    if (this.cursor) {
      this.cursor.style.display = 'none';
    }
    log('CursorControl: onFinished');
  }

  /**
   * Called on each beat.
   * abcjs CursorControl interface method.
   */
  onBeat(beatNumber: number, totalBeats: number, totalTime: number): void {
    log('CursorControl: onBeat', { beatNumber, totalBeats, totalTime });
  }

  /**
   * Called for each note event during playback.
   * This is the main method for note highlighting.
   * abcjs CursorControl interface method.
   */
  onEvent(event: NoteTimingEvent | null): void {
    if (!event) {
      // End of playback
      this.clearHighlighting();
      if (this.cursor) {
        this.cursor.style.display = 'none';
      }
      this.onNoteEvent?.(null);
      return;
    }

    log('CursorControl: onEvent', {
      left: event.left,
      top: event.top,
      height: event.height,
      elementsCount: event.elements?.length ?? 0,
    });

    // Update cursor position
    if (this.cursor && event.left !== undefined) {
      const x = event.left.toString();
      const yStart = (event.top ?? 0).toString();
      const yEnd = ((event.top ?? 0) + (event.height ?? 100)).toString();

      this.cursor.setAttribute('x1', x);
      this.cursor.setAttribute('x2', x);
      this.cursor.setAttribute('y1', yStart);
      this.cursor.setAttribute('y2', yEnd);
      this.cursor.style.display = 'block';
    }

    // Remove previous highlighting
    this.clearHighlighting();

    // Highlight current notes
    if (event.elements) {
      this.lastHighlightedElements = [];
      for (const elementGroup of event.elements) {
        for (const element of elementGroup) {
          if (element) {
            element.classList.add('abcjs-note-playing');
            this.lastHighlightedElements.push(element);
          }
        }
      }
    }

    // Notify callback
    if (this.onNoteEvent && event.midiPitches && event.midiPitches.length > 0) {
      const pitch = event.midiPitches[0];
      this.onNoteEvent({
        midiPitch: pitch.pitch,
        start: pitch.start,
        end: pitch.start + pitch.duration,
      });
    }
  }

  start(): void {
    this.onStart();
  }

  pause(): void {
    // Keep cursor and highlighting visible but stop updates
    log('CursorControl: Paused');
  }

  resume(): void {
    log('CursorControl: Resumed');
  }

  stop(): void {
    this.onFinished();
    log('CursorControl: Stopped');
  }

  private clearHighlighting(): void {
    // Remove class from previously highlighted elements
    for (const element of this.lastHighlightedElements) {
      element.classList.remove('abcjs-note-playing');
    }
    this.lastHighlightedElements = [];

    // Also search for any lingering highlighted elements in the container
    const container = document.getElementById(this.elementId);
    if (!container) return;

    const highlighted = container.querySelectorAll('.abcjs-note-playing');
    highlighted.forEach((el) => el.classList.remove('abcjs-note-playing'));
  }

  dispose(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.clearHighlighting();
    if (this.cursor) {
      this.cursor.remove();
      this.cursor = null;
    }
    this.svg = null;
    log('CursorControl: Disposed');
  }
}

/**
 * Renders ABC notation to an HTML element
 *
 * @param abc - ABC notation string
 * @param elementId - ID of the HTML element to render into
 * @param options - Rendering options
 * @returns RenderResult with tune objects and status
 */
export function renderABC(
  abc: string,
  elementId: string,
  options: RenderOptions = {}
): RenderResult {
  log('renderABC called', { abc: abc.substring(0, 50) + '...', elementId });

  const element = document.getElementById(elementId);
  if (!element) {
    log('Element not found:', elementId);
    return {
      tuneObjects: [],
      success: false,
      error: `Element with id "${elementId}" not found`,
    };
  }

  try {
    // Build abcjs render options
    const abcjsOptions: AbcVisualParams = {
      responsive: options.responsive,
      add_classes: options.add_classes ?? true,
      clickListener: options.clickListener,
    };

    // Add optional params if provided
    if (options.scale !== undefined) {
      abcjsOptions.scale = options.scale;
    }
    if (options.staffwidth !== undefined) {
      abcjsOptions.staffwidth = options.staffwidth;
    }
    if (options.paddingtop !== undefined) {
      abcjsOptions.paddingtop = options.paddingtop;
    }
    if (options.paddingbottom !== undefined) {
      abcjsOptions.paddingbottom = options.paddingbottom;
    }
    if (options.paddingleft !== undefined) {
      abcjsOptions.paddingleft = options.paddingleft;
    }
    if (options.paddingright !== undefined) {
      abcjsOptions.paddingright = options.paddingright;
    }

    log('Rendering with options:', abcjsOptions);

    // Render the ABC notation
    const tuneObjects = abcjs.renderAbc(elementId, abc, abcjsOptions);

    log('Rendered successfully, tune count:', tuneObjects.length);

    return {
      tuneObjects,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('Render error:', errorMessage);

    return {
      tuneObjects: [],
      success: false,
      error: errorMessage,
    };
  }
}

// Global synth instance for simple use cases
let globalSynth: AbcSynth | null = null;

/**
 * Initialize the global synth instance
 * Must be called after user interaction (browser autoplay policy)
 *
 * @param config - Optional synth configuration
 * @returns The initialized synth instance
 */
export async function initSynth(config?: SynthConfig): Promise<AbcSynth> {
  log('initSynth called');

  if (globalSynth) {
    globalSynth.dispose();
  }

  globalSynth = new AbcSynth(config);
  await globalSynth.init();

  return globalSynth;
}

/**
 * Get the global synth instance
 */
export function getSynth(): AbcSynth | null {
  return globalSynth;
}

/**
 * Play a melody from ABC notation
 *
 * Convenience function that renders (if needed), loads, and plays
 *
 * @param abc - ABC notation string
 * @param elementId - Optional element ID for visual rendering and cursor sync
 * @returns Whether playback started successfully
 */
export async function playMelody(abc: string, elementId?: string): Promise<boolean> {
  log('playMelody called');

  // Initialize synth if needed
  if (!globalSynth || globalSynth.getState() === 'uninitialized') {
    await initSynth();
  }

  if (!globalSynth) {
    log('Failed to initialize synth');
    return false;
  }

  // Render if element ID provided
  let tuneObject: TuneObject | null = null;

  if (elementId) {
    const result = renderABC(abc, elementId, {
      responsive: 'resize',
      add_classes: true,
    });

    if (!result.success || result.tuneObjects.length === 0) {
      log('Failed to render ABC');
      return false;
    }

    tuneObject = result.tuneObjects[0];
  } else {
    // Create a temporary element for rendering
    const tempDiv = document.createElement('div');
    tempDiv.id = 'abcjs-temp-render';
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);

    try {
      const result = renderABC(abc, 'abcjs-temp-render');
      if (!result.success || result.tuneObjects.length === 0) {
        log('Failed to render ABC');
        return false;
      }
      tuneObject = result.tuneObjects[0];
    } finally {
      document.body.removeChild(tempDiv);
    }
  }

  // Load and play
  const loaded = await globalSynth.load(tuneObject, elementId);
  if (!loaded) {
    log('Failed to load tune');
    return false;
  }

  return globalSynth.play();
}

/**
 * Stop playback of the global synth
 */
export function stopPlayback(): boolean {
  log('stopPlayback called');

  if (!globalSynth) {
    log('No synth to stop');
    return false;
  }

  return globalSynth.stop();
}

/**
 * Pause playback of the global synth
 */
export function pausePlayback(): boolean {
  log('pausePlayback called');

  if (!globalSynth) {
    return false;
  }

  return globalSynth.pause();
}

/**
 * Resume playback of the global synth
 */
export function resumePlayback(): boolean {
  log('resumePlayback called');

  if (!globalSynth) {
    return false;
  }

  return globalSynth.resume();
}

/**
 * Clean up global synth resources
 */
export function disposeSynth(): void {
  log('disposeSynth called');

  if (globalSynth) {
    globalSynth.dispose();
    globalSynth = null;
  }
}

// Re-export abcjs for advanced use cases
export { abcjs };

// Export types from abcjs that consumers might need
export type { TuneObject, ClickListener };
