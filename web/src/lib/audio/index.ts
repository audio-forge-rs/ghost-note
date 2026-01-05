/**
 * Audio Module
 *
 * Re-exports microphone access, audio analysis, and recording utilities.
 *
 * @module lib/audio
 */

export * from './microphone';
export { default as microphone } from './microphone';

export * from './recorder';
export { default as recorder } from './recorder';
