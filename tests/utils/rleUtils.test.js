// Unit tests for RLE utilities
import { decodeRLE, encodeRLE, parseRLEFile, decodeMultiplePatterns } from '../../src/utils/rleUtils.js';

describe('RLE Utils', () => {
  describe('decodeRLE', () => {
    test('should decode simple patterns', () => {
      const result = decodeRLE('o!');
      expect(result).toEqual([[0, 0]]);
    });

    test('should decode multiple live cells', () => {
      const result = decodeRLE('3o!');
      expect(result).toEqual([[0, 0], [0, 1], [0, 2]]);
    });

    test('should handle dead cells', () => {
      const result = decodeRLE('bo2b!');
      expect(result).toEqual([[0, 1]]);
    });

    test('should handle line breaks', () => {
      const result = decodeRLE('o$o!');
      expect(result).toEqual([[0, 0], [1, 0]]);
    });

    test('should decode blinker pattern', () => {
      const result = decodeRLE('o$o$o!');
      expect(result).toEqual([[0, 0], [1, 0], [2, 0]]);
    });

    test('should decode glider pattern', () => {
      const result = decodeRLE('bo$2bo$3o!');
      expect(result).toEqual([
        [0, 1],
        [1, 2],
        [2, 0], [2, 1], [2, 2]
      ]);
    });

    test('should handle multiple empty lines', () => {
      const result = decodeRLE('o$3$o!');
      expect(result).toEqual([[0, 0], [4, 0]]);
    });

    test('should handle empty pattern', () => {
      expect(decodeRLE('!')).toEqual([]);
      expect(decodeRLE('')).toEqual([]);
    });

    test('should handle complex patterns', () => {
      const result = decodeRLE('2o$2o!'); // Block pattern
      expect(result).toEqual([
        [0, 0], [0, 1],
        [1, 0], [1, 1]
      ]);
    });
  });

  describe('encodeRLE', () => {
    test('should encode simple patterns', () => {
      const grid = [
        [1, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ];

      const result = encodeRLE(grid);
      expect(result.rle).toBe('o!');
    });

    test('should encode block pattern', () => {
      const grid = [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0]
      ];

      const result = encodeRLE(grid);
      expect(result.rle).toBe('2o$2o!');
    });

    test('should handle empty grid', () => {
      const result = encodeRLE([]);
      expect(result.rle).toBe('!');
    });

    test('should handle all-dead grid', () => {
      const grid = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ];

      const result = encodeRLE(grid);
      expect(result.rle).toBe('!');
    });

    test('should return bounding box information', () => {
      const grid = [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0],
        [0, 1, 1, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
      ];

      const result = encodeRLE(grid);
      expect(result.minRow).toBe(1);
      expect(result.maxRow).toBe(2);
      expect(result.minCol).toBe(1);
      expect(result.maxCol).toBe(2);
    });
  });

  describe('parseRLEFile', () => {
    test('should parse complete RLE file', () => {
      const rleContent = `#N Glider
x = 3, y = 3, rule = B3/S23
bo$2bo$3o!`;

      const result = parseRLEFile(rleContent);
      expect(result.name).toBe('Glider');
      expect(result.width).toBe(3);
      expect(result.height).toBe(3);
      expect(result.pattern).toEqual([
        [0, 1],
        [1, 2],
        [2, 0], [2, 1], [2, 2]
      ]);
    });

    test('should handle file without name', () => {
      const rleContent = `x = 2, y = 2, rule = B3/S23
2o$2o!`;

      const result = parseRLEFile(rleContent);
      expect(result.name).toBe('Unknown Pattern');
      expect(result.width).toBe(2);
      expect(result.height).toBe(2);
    });

    test('should handle malformed header', () => {
      const rleContent = `#N Test
invalid header
2o$2o!`;

      const result = parseRLEFile(rleContent);
      expect(result.name).toBe('Test');
      expect(result.width).toBe(50); // Default
      expect(result.height).toBe(50); // Default
    });

    test('should handle invalid RLE data', () => {
      const rleContent = `#N Test
x = 2, y = 2, rule = B3/S23
invalid_rle_data`;

      const result = parseRLEFile(rleContent);
      expect(result.name).toBe('Test');
      expect(result.pattern).toEqual([]);
    });

    test('should filter out invalid coordinates', () => {
      const rleContent = `#N Test
x = 2, y = 2, rule = B3/S23
2o$2o!`;

      const result = parseRLEFile(rleContent);
      // All coordinates should be valid numbers
      expect(result.pattern.every(([y, x]) =>
        typeof y === 'number' && typeof x === 'number' &&
        !isNaN(y) && !isNaN(x) && Math.abs(y) < 1000 && Math.abs(x) < 1000
      )).toBe(true);
    });
  });

  describe('decodeMultiplePatterns', () => {
    test('should decode multiple patterns with offsets', () => {
      const patterns = [
        { x: 0, y: 0, rle: 'o!' },
        { x: 2, y: 1, rle: 'o!' }
      ];

      const result = decodeMultiplePatterns(patterns);
      expect(result).toEqual([
        [0, 0],  // First pattern at (0,0)
        [1, 2]   // Second pattern at (1,2)
      ]);
    });

    test('should handle overlapping patterns', () => {
      const patterns = [
        { x: 0, y: 0, rle: '2o!' },
        { x: 1, y: 0, rle: '2o!' }
      ];

      const result = decodeMultiplePatterns(patterns);
      expect(result).toEqual([
        [0, 0], [0, 1],  // First pattern
        [0, 1], [0, 2]   // Second pattern (overlapping at [0,1])
      ]);
    });

    test('should handle empty patterns array', () => {
      const result = decodeMultiplePatterns([]);
      expect(result).toEqual([]);
    });

    test('should handle patterns without RLE', () => {
      const patterns = [
        { x: 0, y: 0, rle: 'o!' },
        { x: 1, y: 1 }, // No RLE
        { x: 2, y: 2, rle: 'o!' }
      ];

      const result = decodeMultiplePatterns(patterns);
      expect(result).toEqual([
        [0, 0],
        [2, 2]
      ]);
    });

    test('should handle negative offsets', () => {
      const patterns = [
        { x: -1, y: -1, rle: 'o!' }
      ];

      const result = decodeMultiplePatterns(patterns);
      expect(result).toEqual([[-1, -1]]);
    });
  });
});
