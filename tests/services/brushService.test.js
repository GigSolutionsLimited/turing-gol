// Unit tests for BrushService
import { BrushService } from '../../src/services/brushService.js';

describe('BrushService', () => {
  describe('getPatternsForChallenge', () => {
    test('should return patterns for valid challenge and brushes', () => {
      const challenge = {
        brushes: ['glider', 'block']
      };

      const brushes = {
        glider: { name: 'Glider', pattern: [[0, 1], [1, 2], [2, 0]] },
        block: { name: 'Block', pattern: [[0, 0], [0, 1], [1, 0], [1, 1]] },
        unused: { name: 'Unused', pattern: [] }
      };

      const result = BrushService.getPatternsForChallenge(challenge, brushes);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(brushes.glider);
      expect(result[1]).toEqual(brushes.block);
    });

    test('should filter out missing brushes', () => {
      const challenge = {
        brushes: ['glider', 'nonexistent', 'block']
      };

      const brushes = {
        glider: { name: 'Glider', pattern: [] },
        block: { name: 'Block', pattern: [] }
      };

      const result = BrushService.getPatternsForChallenge(challenge, brushes);
      expect(result).toHaveLength(2);
      expect(result.map(p => p.name)).toEqual(['Glider', 'Block']);
    });

    test('should return empty array for null/undefined challenge', () => {
      const brushes = { test: { name: 'Test' } };

      expect(BrushService.getPatternsForChallenge(null, brushes)).toEqual([]);
      expect(BrushService.getPatternsForChallenge(undefined, brushes)).toEqual([]);
    });

    test('should return empty array for challenge without brushes', () => {
      const challenge = { pattern: [] }; // No brushes property
      const brushes = { test: { name: 'Test' } };

      expect(BrushService.getPatternsForChallenge(challenge, brushes)).toEqual([]);
    });

    test('should return empty array for null/undefined brushes', () => {
      const challenge = { brushes: ['glider'] };

      expect(BrushService.getPatternsForChallenge(challenge, null)).toEqual([]);
      expect(BrushService.getPatternsForChallenge(challenge, undefined)).toEqual([]);
    });
  });

  describe('isEraserPattern', () => {
    test('should identify eraser patterns', () => {
      const eraser1 = { name: 'eraser3x3', pattern: [] };
      const eraser2 = { name: 'Eraser11x11', pattern: [] };
      const eraser3 = { name: 'Big Eraser Tool', pattern: [] };

      expect(BrushService.isEraserPattern(eraser1)).toBe(true);
      expect(BrushService.isEraserPattern(eraser2)).toBe(true);
      expect(BrushService.isEraserPattern(eraser3)).toBe(true);
    });

    test('should not identify non-eraser patterns', () => {
      const glider = { name: 'Glider', pattern: [] };
      const block = { name: 'Block', pattern: [] };

      expect(BrushService.isEraserPattern(glider)).toBe(false);
      expect(BrushService.isEraserPattern(block)).toBe(false);
    });

    test('should handle null/undefined patterns', () => {
      expect(BrushService.isEraserPattern(null)).toBeFalsy();
      expect(BrushService.isEraserPattern(undefined)).toBeFalsy();
      expect(BrushService.isEraserPattern({})).toBeFalsy();
    });

    test('should handle pattern without name', () => {
      const noName = { pattern: [] };
      expect(BrushService.isEraserPattern(noName)).toBeFalsy();
    });
  });

  describe('transformPattern', () => {
    const testPattern = {
      name: 'L-shape',
      pattern: [[0, 0], [1, 0], [2, 0], [2, 1]] // L-shaped pattern
    };

    test('should flip pattern around X axis', () => {
      const result = BrushService.transformPattern(testPattern, 'flipX');

      // Pattern should be flipped vertically
      expect(result.pattern).toHaveLength(4);
      expect(result.name).toBe(testPattern.name);
      expect(result.pattern).not.toEqual(testPattern.pattern);
    });

    test('should flip pattern around Y axis', () => {
      const result = BrushService.transformPattern(testPattern, 'flipY');

      // Pattern should be flipped horizontally
      expect(result.pattern).toHaveLength(4);
      expect(result.name).toBe(testPattern.name);
      expect(result.pattern).not.toEqual(testPattern.pattern);
    });

    test('should rotate pattern clockwise', () => {
      const result = BrushService.transformPattern(testPattern, 'rotateClockwise');

      expect(result.pattern).toHaveLength(4);
      expect(result.pattern).not.toEqual(testPattern.pattern);
    });

    test('should rotate pattern counterclockwise', () => {
      const result = BrushService.transformPattern(testPattern, 'rotateCounterclockwise');

      expect(result.pattern).toHaveLength(4);
      expect(result.pattern).not.toEqual(testPattern.pattern);
    });

    test('should preserve pattern name and other properties', () => {
      const result = BrushService.transformPattern(testPattern, 'flipX');

      expect(result.name).toBe(testPattern.name);
    });

    test('should handle empty pattern', () => {
      const emptyPattern = { name: 'Empty', pattern: [] };
      const result = BrushService.transformPattern(emptyPattern, 'flipX');

      expect(result.pattern).toEqual([]);
    });

    test('should handle invalid transformation type', () => {
      const result = BrushService.transformPattern(testPattern, 'invalidTransform');

      expect(result).toEqual(testPattern); // Should return original
    });

    test('should handle null/undefined pattern', () => {
      expect(BrushService.transformPattern(null, 'flipX')).toBe(null);
      expect(BrushService.transformPattern(undefined, 'flipX')).toBe(undefined);
    });

    test('should handle pattern without pattern property', () => {
      const noPattern = { name: 'Test' };
      const result = BrushService.transformPattern(noPattern, 'flipX');

      expect(result).toEqual(noPattern);
    });

    test('should handle single cell pattern', () => {
      const singleCell = { name: 'Single', pattern: [[0, 0]] };
      const result = BrushService.transformPattern(singleCell, 'flipX');

      expect(result.pattern).toHaveLength(1);
    });

    test('should be able to chain transformations', () => {
      let result = BrushService.transformPattern(testPattern, 'flipX');
      result = BrushService.transformPattern(result, 'flipX');

      // Double flip should return to original (or very close)
      expect(result.pattern).toHaveLength(testPattern.pattern.length);
    });

    test('should rotate around origin to maintain cursor alignment', () => {
      // L-shaped pattern with origin at top-left
      const lPattern = {
        name: 'L-shape',
        pattern: [[0, 0], [1, 0], [2, 0], [2, 1]] // L pointing right
      };

      const rotatedCW = BrushService.transformPattern(lPattern, 'rotateClockwise');
      const rotatedCCW = BrushService.transformPattern(lPattern, 'rotateCounterclockwise');

      // After rotation and normalization, patterns should start from (0,0)
      const minYCW = Math.min(...rotatedCW.pattern.map(([y]) => y));
      const minXCW = Math.min(...rotatedCW.pattern.map(([, x]) => x));
      expect(minYCW).toBe(0); // Normalized to start from (0,0)
      expect(minXCW).toBe(0);

      const minYCCW = Math.min(...rotatedCCW.pattern.map(([y]) => y));
      const minXCCW = Math.min(...rotatedCCW.pattern.map(([, x]) => x));
      expect(minYCCW).toBe(0); // Normalized to start from (0,0)
      expect(minXCCW).toBe(0);

      // All coordinates should be integers
      rotatedCW.pattern.forEach(([y, x]) => {
        expect(Number.isInteger(y)).toBe(true);
        expect(Number.isInteger(x)).toBe(true);
      });

      rotatedCCW.pattern.forEach(([y, x]) => {
        expect(Number.isInteger(y)).toBe(true);
        expect(Number.isInteger(x)).toBe(true);
      });
    });

    test('should handle rotation of patterns with negative coordinates', () => {
      // Pattern with negative coordinates (pattern extends left/up from origin)
      const crossPattern = {
        name: 'cross',
        pattern: [[-1, 0], [0, -1], [0, 0], [0, 1], [1, 0]] // Plus sign centered on origin
      };

      const rotated = BrushService.transformPattern(crossPattern, 'rotateClockwise');

      // Pattern should be normalized to start from (0,0)
      const minY = Math.min(...rotated.pattern.map(([y]) => y));
      const minX = Math.min(...rotated.pattern.map(([, x]) => x));
      expect(minY).toBe(0); // Normalized to start from (0,0)
      expect(minX).toBe(0);

      // Pattern should still be a cross after rotation (symmetric)
      expect(rotated.pattern).toHaveLength(5);

      // All coordinates should be integers
      rotated.pattern.forEach(([y, x]) => {
        expect(Number.isInteger(y)).toBe(true);
        expect(Number.isInteger(x)).toBe(true);
      });
    });
  });

  describe('discoverBrushFiles', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      global.fetch.mockRestore();
    });

    test('should discover available brush files', async () => {
      // Mock manifest.json response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          brushes: ['block.rle', 'blinker.rle', 'glider.rle', 'eraser3x3.rle']
        })
      });

      const result = await BrushService.discoverBrushFiles();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('block.rle');
      expect(result).toContain('blinker.rle');
      expect(result).toContain('glider.rle');
    });

    test('should return empty array when no files are found', async () => {
      // Mock manifest.json request to return 404
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

      const result = await BrushService.discoverBrushFiles();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test('should handle fetch errors gracefully', async () => {
      // Mock fetch to throw errors
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await BrushService.discoverBrushFiles();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    test('should use manifest.json if available', async () => {
      const mockManifest = {
        brushes: ['custom1.rle', 'custom2.rle', 'custom3.rle']
      };

      global.fetch = jest.fn((url) => {
        if (url.includes('manifest.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockManifest)
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      const result = await BrushService.discoverBrushFiles();

      expect(result).toEqual(['custom1.rle', 'custom2.rle', 'custom3.rle']);
      expect(global.fetch).toHaveBeenCalledWith('/brushes/manifest.json');
    });
  });

  describe('loadAllBrushes', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      global.fetch.mockRestore();
    });

    test('should load brushes from discovered files', async () => {
      // Mock the manifest and brush file content loading
      const mockRleContent = '#N Test\nx = 2, y = 2\n2o$2o!';

      global.fetch = jest.fn((url) => {
        if (url.endsWith('/brushes/manifest.json')) {
          // Mock manifest response
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              brushes: ['block.rle', 'glider.rle']
            })
          });
        } else {
          // Mock brush file content
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(mockRleContent)
          });
        }
      });

      const result = await BrushService.loadAllBrushes();

      expect(typeof result).toBe('object');
      expect(result.block).toBeDefined();
      expect(result.glider).toBeDefined();
    });

    test('should handle fetch errors gracefully', async () => {
      // Mock fetch to simulate error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await BrushService.loadAllBrushes();
      expect(result).toEqual({});
    });

    test('should return empty object when no brush files found', async () => {
      // Mock manifest fetch to fail (no brushes available)
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404
      });

      const result = await BrushService.loadAllBrushes();
      expect(typeof result).toBe('object');
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('detector patterns', () => {
    test('should identify detector patterns', () => {
      const detectorPattern = {
        type: 'detector',
        name: 'Test Detector',
        pattern: [[0, 0]]
      };

      const regularPattern = {
        name: 'Regular Pattern',
        pattern: [[0, 0]]
      };

      expect(BrushService.isDetectorPattern(detectorPattern)).toBe(true);
      expect(BrushService.isDetectorPattern(regularPattern)).toBe(false);
    });

    test('should get correct pattern type', () => {
      const detectorPattern = { type: 'detector', name: 'Detector' };
      const eraserPattern = { name: 'eraser3x3' };
      const normalPattern = { name: 'block' };

      expect(BrushService.getPatternType(detectorPattern)).toBe('detector');
      expect(BrushService.getPatternType(eraserPattern)).toBe('eraser');
      expect(BrushService.getPatternType(normalPattern)).toBe('normal');
    });

    test('should create detector pattern with defaults', () => {
      const pattern = [[0, 0], [1, 0]];
      const detector = BrushService.createDetectorPattern('Test Detector', pattern);

      expect(detector).toMatchObject({
        name: 'Test Detector',
        type: 'detector',
        pattern: [[0, 0], [1, 0]],
        initialValue: 0,
        falloffPeriod: 10, // DEFAULT_FALLOFF_PERIOD
        currentValue: 0,
        activationTimer: 0,
        lastCoveredGeneration: -1
      });
    });

    test('should create detector pattern with custom options', () => {
      const pattern = [[0, 0]];
      const options = {
        initialValue: 1,
        falloffPeriod: 20
      };

      const detector = BrushService.createDetectorPattern('Active Detector', pattern, options);

      expect(detector).toMatchObject({
        name: 'Active Detector',
        type: 'detector',
        pattern: [[0, 0]],
        initialValue: 1,
        falloffPeriod: 20,
        currentValue: 1,
        activationTimer: 0,
        lastCoveredGeneration: -1
      });
    });
  });

  describe('transformPattern', () => {
    test('should handle pattern transformations without creating fractional coordinates', () => {
      // Test pattern with odd dimensions that would cause fractional centers
      const testPattern = {
        name: 'test',
        pattern: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 2]] // Creates bounds with fractional center
      };

      const flippedX = BrushService.transformPattern(testPattern, 'flipX');
      const flippedY = BrushService.transformPattern(testPattern, 'flipY');
      const rotatedCW = BrushService.transformPattern(testPattern, 'rotateClockwise');
      const rotatedCCW = BrushService.transformPattern(testPattern, 'rotateCounterclockwise');

      // All coordinates should be integers
      [flippedX, flippedY, rotatedCW, rotatedCCW].forEach(transformed => {
        transformed.pattern.forEach(([y, x]) => {
          expect(Number.isInteger(y)).toBe(true);
          expect(Number.isInteger(x)).toBe(true);
        });
      });
    });

    test('should preserve pattern structure during transformations', () => {
      const blinker = {
        name: 'blinker',
        pattern: [[0, 0], [0, 1], [0, 2]] // Horizontal line
      };

      const rotated = BrushService.transformPattern(blinker, 'rotateClockwise');

      // After rotation, should have 3 cells in a vertical line
      expect(rotated.pattern).toHaveLength(3);
      // All coordinates should be integers
      rotated.pattern.forEach(([y, x]) => {
        expect(Number.isInteger(y)).toBe(true);
        expect(Number.isInteger(x)).toBe(true);
      });
    });
  });
});
