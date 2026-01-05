/**
 * Audio Module
 *
 * Re-exports microphone access, audio analysis, recording, export utilities,
 * and synced playback for recording with melody guide tracks.
 *
 * @module lib/audio
 */

export * from './microphone';
export { default as microphone } from './microphone';

export * from './recorder';
export { default as recorder } from './recorder';

export * from './export';
export { default as audioExport } from './export';

export * from './syncPlayback';
export { default as syncPlayback } from './syncPlayback';
