/**
 * Tests for usePoemStore
 *
 * @module stores/usePoemStore.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { usePoemStore, selectCurrentLyrics, selectCurrentVersion, selectHasVersions, selectVersionCount, selectIsViewingOriginal, selectHasPoem, selectWordCount, selectLineCount } from './usePoemStore';

describe('usePoemStore', () => {
  beforeEach(() => {
    // Reset store before each test
    usePoemStore.getState().reset();
    // Clear localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('ghost-note-poem-store');
    }
  });

  describe('initial state', () => {
    it('should have empty initial state', () => {
      const state = usePoemStore.getState();
      expect(state.original).toBe('');
      expect(state.versions).toEqual([]);
      expect(state.currentVersionIndex).toBe(-1);
    });
  });

  describe('setPoem', () => {
    it('should set the original poem', () => {
      const poem = 'Roses are red\nViolets are blue';
      usePoemStore.getState().setPoem(poem);

      const state = usePoemStore.getState();
      expect(state.original).toBe(poem);
    });

    it('should reset versions when setting new poem', () => {
      // Add a version first
      usePoemStore.getState().setPoem('First poem');
      usePoemStore.getState().addVersion('First version');

      // Set a new poem
      usePoemStore.getState().setPoem('Second poem');

      const state = usePoemStore.getState();
      expect(state.versions).toEqual([]);
      expect(state.currentVersionIndex).toBe(-1);
    });
  });

  describe('addVersion', () => {
    it('should add a new version', () => {
      usePoemStore.getState().setPoem('Original poem');
      usePoemStore.getState().addVersion('Modified lyrics', 'First edit');

      const state = usePoemStore.getState();
      expect(state.versions).toHaveLength(1);
      expect(state.versions[0].lyrics).toBe('Modified lyrics');
      expect(state.versions[0].description).toBe('First edit');
      expect(state.currentVersionIndex).toBe(0);
    });

    it('should generate unique IDs for versions', () => {
      usePoemStore.getState().setPoem('Original');
      usePoemStore.getState().addVersion('Version 1');
      usePoemStore.getState().addVersion('Version 2');

      const state = usePoemStore.getState();
      expect(state.versions[0].id).not.toBe(state.versions[1].id);
    });

    it('should set timestamp on versions', () => {
      const beforeTime = Date.now();
      usePoemStore.getState().setPoem('Original');
      usePoemStore.getState().addVersion('Version 1');
      const afterTime = Date.now();

      const state = usePoemStore.getState();
      expect(state.versions[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(state.versions[0].timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should compute changes from previous version', () => {
      usePoemStore.getState().setPoem('Original');
      usePoemStore.getState().addVersion('Modified');

      const state = usePoemStore.getState();
      expect(state.versions[0].changes).toHaveLength(1);
      expect(state.versions[0].changes[0].type).toBe('modify');
    });
  });

  describe('revertToVersion', () => {
    it('should revert to a specific version', () => {
      usePoemStore.getState().setPoem('Original');
      usePoemStore.getState().addVersion('Version 1');
      usePoemStore.getState().addVersion('Version 2');

      usePoemStore.getState().revertToVersion(0);

      const state = usePoemStore.getState();
      expect(state.currentVersionIndex).toBe(0);
    });

    it('should revert to original when index is -1', () => {
      usePoemStore.getState().setPoem('Original');
      usePoemStore.getState().addVersion('Version 1');

      usePoemStore.getState().revertToVersion(-1);

      const state = usePoemStore.getState();
      expect(state.currentVersionIndex).toBe(-1);
    });

    it('should not change state for invalid index', () => {
      usePoemStore.getState().setPoem('Original');
      usePoemStore.getState().addVersion('Version 1');

      usePoemStore.getState().revertToVersion(100);

      const state = usePoemStore.getState();
      expect(state.currentVersionIndex).toBe(0);
    });
  });

  describe('updateCurrentVersion', () => {
    it('should update the current version lyrics', () => {
      usePoemStore.getState().setPoem('Original');
      usePoemStore.getState().addVersion('Version 1');
      usePoemStore.getState().updateCurrentVersion('Updated Version 1');

      const state = usePoemStore.getState();
      expect(state.versions[0].lyrics).toBe('Updated Version 1');
    });

    it('should create a new version when no version is selected', () => {
      usePoemStore.getState().setPoem('Original');
      usePoemStore.getState().updateCurrentVersion('New lyrics');

      const state = usePoemStore.getState();
      expect(state.versions).toHaveLength(1);
      expect(state.versions[0].lyrics).toBe('New lyrics');
    });
  });

  describe('deleteVersion', () => {
    it('should delete a version by ID', () => {
      usePoemStore.getState().setPoem('Original');
      usePoemStore.getState().addVersion('Version 1');
      usePoemStore.getState().addVersion('Version 2');

      const state = usePoemStore.getState();
      const idToDelete = state.versions[0].id;

      usePoemStore.getState().deleteVersion(idToDelete);

      const newState = usePoemStore.getState();
      expect(newState.versions).toHaveLength(1);
      expect(newState.versions[0].lyrics).toBe('Version 2');
    });

    it('should adjust currentVersionIndex when deleting current version', () => {
      usePoemStore.getState().setPoem('Original');
      usePoemStore.getState().addVersion('Version 1');
      usePoemStore.getState().addVersion('Version 2');

      const state = usePoemStore.getState();
      expect(state.currentVersionIndex).toBe(1);

      usePoemStore.getState().deleteVersion(state.versions[1].id);

      const newState = usePoemStore.getState();
      expect(newState.currentVersionIndex).toBe(0);
    });

    it('should not change state for non-existent ID', () => {
      usePoemStore.getState().setPoem('Original');
      usePoemStore.getState().addVersion('Version 1');

      usePoemStore.getState().deleteVersion('non-existent-id');

      const state = usePoemStore.getState();
      expect(state.versions).toHaveLength(1);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      usePoemStore.getState().setPoem('Original');
      usePoemStore.getState().addVersion('Version 1');

      usePoemStore.getState().reset();

      const state = usePoemStore.getState();
      expect(state.original).toBe('');
      expect(state.versions).toEqual([]);
      expect(state.currentVersionIndex).toBe(-1);
    });
  });

  describe('selectors', () => {
    describe('selectCurrentLyrics', () => {
      it('should return original when no version is selected', () => {
        usePoemStore.getState().setPoem('Original poem');

        const lyrics = selectCurrentLyrics(usePoemStore.getState());
        expect(lyrics).toBe('Original poem');
      });

      it('should return version lyrics when a version is selected', () => {
        usePoemStore.getState().setPoem('Original');
        usePoemStore.getState().addVersion('Modified');

        const lyrics = selectCurrentLyrics(usePoemStore.getState());
        expect(lyrics).toBe('Modified');
      });
    });

    describe('selectCurrentVersion', () => {
      it('should return null when no version is selected', () => {
        usePoemStore.getState().setPoem('Original');

        const version = selectCurrentVersion(usePoemStore.getState());
        expect(version).toBeNull();
      });

      it('should return the current version when one is selected', () => {
        usePoemStore.getState().setPoem('Original');
        usePoemStore.getState().addVersion('Modified', 'Test description');

        const version = selectCurrentVersion(usePoemStore.getState());
        expect(version).not.toBeNull();
        expect(version?.lyrics).toBe('Modified');
        expect(version?.description).toBe('Test description');
      });
    });

    describe('selectHasVersions', () => {
      it('should return false when no versions exist', () => {
        usePoemStore.getState().setPoem('Original');

        expect(selectHasVersions(usePoemStore.getState())).toBe(false);
      });

      it('should return true when versions exist', () => {
        usePoemStore.getState().setPoem('Original');
        usePoemStore.getState().addVersion('Modified');

        expect(selectHasVersions(usePoemStore.getState())).toBe(true);
      });
    });

    describe('selectVersionCount', () => {
      it('should return 0 when no versions exist', () => {
        expect(selectVersionCount(usePoemStore.getState())).toBe(0);
      });

      it('should return correct count', () => {
        usePoemStore.getState().setPoem('Original');
        usePoemStore.getState().addVersion('V1');
        usePoemStore.getState().addVersion('V2');
        usePoemStore.getState().addVersion('V3');

        expect(selectVersionCount(usePoemStore.getState())).toBe(3);
      });
    });

    describe('selectIsViewingOriginal', () => {
      it('should return true when viewing original', () => {
        usePoemStore.getState().setPoem('Original');

        expect(selectIsViewingOriginal(usePoemStore.getState())).toBe(true);
      });

      it('should return false when viewing a version', () => {
        usePoemStore.getState().setPoem('Original');
        usePoemStore.getState().addVersion('Modified');

        expect(selectIsViewingOriginal(usePoemStore.getState())).toBe(false);
      });
    });

    describe('selectHasPoem', () => {
      it('should return false when no poem', () => {
        expect(selectHasPoem(usePoemStore.getState())).toBe(false);
      });

      it('should return false for whitespace-only poem', () => {
        usePoemStore.getState().setPoem('   \n\t   ');
        expect(selectHasPoem(usePoemStore.getState())).toBe(false);
      });

      it('should return true when poem has content', () => {
        usePoemStore.getState().setPoem('Hello');
        expect(selectHasPoem(usePoemStore.getState())).toBe(true);
      });
    });

    describe('selectWordCount', () => {
      it('should return 0 for empty poem', () => {
        expect(selectWordCount(usePoemStore.getState())).toBe(0);
      });

      it('should count words correctly', () => {
        usePoemStore.getState().setPoem('One two three four five');
        expect(selectWordCount(usePoemStore.getState())).toBe(5);
      });

      it('should handle multiple whitespace', () => {
        usePoemStore.getState().setPoem('One   two\n\nthree\t\tfour');
        expect(selectWordCount(usePoemStore.getState())).toBe(4);
      });
    });

    describe('selectLineCount', () => {
      it('should return 0 for empty poem', () => {
        expect(selectLineCount(usePoemStore.getState())).toBe(0);
      });

      it('should count lines correctly', () => {
        usePoemStore.getState().setPoem('Line one\nLine two\nLine three');
        expect(selectLineCount(usePoemStore.getState())).toBe(3);
      });

      it('should skip empty lines', () => {
        usePoemStore.getState().setPoem('Line one\n\n\nLine two');
        expect(selectLineCount(usePoemStore.getState())).toBe(2);
      });
    });
  });
});
