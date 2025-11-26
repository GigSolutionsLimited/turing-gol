// Unit tests for ChallengeService
import { ChallengeService } from '../../src/services/challengeService.js';

describe('ChallengeService', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };
  });

  afterEach(() => {
    global.fetch.mockRestore();
    jest.clearAllMocks();
  });

  describe('discoverChallengeFiles', () => {
    test('should use manifest.json if available', async () => {
      const mockManifest = {
        challenges: ['1.json', '2.json', '3.json', '4.json']
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

      const result = await ChallengeService.discoverChallengeFiles();

      expect(result).toEqual(['1.json', '2.json', '3.json', '4.json']);
      expect(global.fetch).toHaveBeenCalledWith('/challenges/manifest.json');
    });

    test('should discover challenge files by probing when no manifest', async () => {
      global.fetch = jest.fn((url, options) => {
        if (url.includes('manifest.json')) {
          return Promise.resolve({ ok: false, status: 404 });
        }

        if (options && options.method === 'HEAD') {
          // HEAD request for discovery
          const fileName = url.split('/').pop();
          if (['1.json', '2.json', '3.json'].includes(fileName)) {
            return Promise.resolve({ ok: true });
          }
          return Promise.resolve({ ok: false, status: 404 });
        }

        return Promise.resolve({ ok: false, status: 404 });
      });

      const result = await ChallengeService.discoverChallengeFiles();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('1.json');
      expect(result).toContain('2.json');
      expect(result).toContain('3.json');
    });

    test('should return empty array when no challenges found', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

      const result = await ChallengeService.discoverChallengeFiles();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    test('should handle fetch errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await ChallengeService.discoverChallengeFiles();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('loadAvailableChallenges', () => {
    test('should load challenges from discovered files', async () => {
      const mockChallenge1 = { name: '1. Basics', width: 61, height: 61 };
      const mockChallenge2 = { name: '2. Glider Gun', width: 61, height: 61 };

      global.fetch = jest.fn((url, options) => {
        if (url.includes('manifest.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ challenges: ['1.json', '2.json'] })
          });
        }

        if (url.includes('1.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockChallenge1)
          });
        }

        if (url.includes('2.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockChallenge2)
          });
        }

        return Promise.resolve({ ok: false, status: 404 });
      });

      const result = await ChallengeService.loadAvailableChallenges();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe('1. Basics');
      expect(result[1].id).toBe(2);
      expect(result[1].name).toBe('2. Glider Gun');
    });

    test('should sort challenges by ID', async () => {
      global.fetch = jest.fn((url, options) => {
        if (url.includes('manifest.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ challenges: ['3.json', '1.json', '2.json'] })
          });
        }

        const challenges = {
          '1.json': { name: '1. First' },
          '2.json': { name: '2. Second' },
          '3.json': { name: '3. Third' }
        };

        const fileName = url.split('/').pop();
        if (challenges[fileName]) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(challenges[fileName])
          });
        }

        return Promise.resolve({ ok: false, status: 404 });
      });

      const result = await ChallengeService.loadAvailableChallenges();

      expect(result.map(c => c.id)).toEqual([1, 2, 3]);
    });

    test('should handle missing challenge files gracefully', async () => {
      global.fetch = jest.fn((url) => {
        if (url.includes('manifest.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ challenges: ['1.json', 'missing.json'] })
          });
        }

        if (url.includes('1.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ name: '1. Basics' })
          });
        }

        return Promise.resolve({ ok: false, status: 404 });
      });

      const result = await ChallengeService.loadAvailableChallenges();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('1. Basics');
    });
  });

  describe('loadChallenge', () => {
    test('should extract exercise number from name', async () => {
      const mockChallenge = { name: '1. Basics', patterns: [] };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockChallenge)
      });

      const result = await ChallengeService.loadChallenge('1. Basics');

      expect(result).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith('/challenges/1.json');
    });

    test('should return null for invalid exercise name', async () => {
      const result = await ChallengeService.loadChallenge('Invalid Name');
      expect(result).toBeNull();
    });

    test('should use localStorage when available', async () => {
      const mockStorageData = JSON.stringify({ name: 'Cached Challenge', patterns: [] });
      global.localStorage.getItem.mockReturnValue(mockStorageData);

      const result = await ChallengeService.loadChallenge('1. Basics');

      expect(global.localStorage.getItem).toHaveBeenCalledWith('challenge_1');
      expect(result).toBeDefined();
      expect(result.pattern).toBeDefined();
    });

    test('should force reload when requested', async () => {
      const mockStorageData = JSON.stringify({ name: 'Cached Challenge' });
      const mockFileData = { name: 'Fresh Challenge', patterns: [] };

      global.localStorage.getItem.mockReturnValue(mockStorageData);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFileData)
      });

      const result = await ChallengeService.loadChallenge('1. Basics', true);

      expect(global.fetch).toHaveBeenCalledWith('/challenges/1.json');
      expect(result).toBeDefined();
    });
  });

  describe('processChallengeData', () => {
    test('should process challenge data with default values', () => {
      const rawData = { name: 'Test Challenge' };

      const result = ChallengeService.processChallengeData(rawData);

      expect(result.pattern).toEqual([]);
      expect(result.setup).toEqual([]);
      expect(result.targetTurn).toBe(150);
      expect(result.width).toBe(50);
      expect(result.height).toBe(50);
      expect(result.brushes).toEqual([]);
    });

    test('should preserve provided values', () => {
      const rawData = {
        name: 'Test Challenge',
        patterns: [{ x: 0, y: 0, rle: 'o!' }],
        targetTurn: 200,
        width: 100,
        height: 100,
        brushes: ['glider']
      };

      const result = ChallengeService.processChallengeData(rawData, '1');

      expect(result.targetTurn).toBe(200);
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
      expect(result.brushes).toEqual(['glider']);
    });

    test('should include detectorFalloffPeriod from challenge data', () => {
      const rawData = {
        patterns: [{ x: 0, y: 0, rle: 'o!' }],
        detectorFalloffPeriod: 43,
        brushes: ['detector1x1']
      };

      const result = ChallengeService.processChallengeData(rawData, '4');

      expect(result.detectorFalloffPeriod).toBe(43);
    });

    test('should use default detectorFalloffPeriod when not specified', () => {
      const rawData = {
        patterns: [{ x: 0, y: 0, rle: 'o!' }],
        brushes: ['detector1x1']
      };

      const result = ChallengeService.processChallengeData(rawData, '1');

      expect(result.detectorFalloffPeriod).toBe(10); // Default value
    });

    test('should include detectors array from challenge data', () => {
      const rawData = {
        patterns: [],
        detectors: [
          { x: 80, y: 0, state: 'active' },
          { x: -80, y: 0, direction: 'inactive' }
        ],
        brushes: ['p46GliderGun']
      };

      const result = ChallengeService.processChallengeData(rawData, '4');

      expect(result.detectors).toHaveLength(2);
      expect(result.detectors[0]).toEqual({ x: 80, y: 0, state: 'active' });
      expect(result.detectors[1]).toEqual({ x: -80, y: 0, direction: 'inactive' });
    });

    test('should include description from challenge data', () => {
      const rawData = {
        patterns: [{ x: 0, y: 0, rle: 'o!' }],
        description: 'This is a test challenge description'
      };

      const result = ChallengeService.processChallengeData(rawData, '1');

      expect(result.description).toBe('This is a test challenge description');
    });

    test('should use empty string for description when not specified', () => {
      const rawData = {
        patterns: [{ x: 0, y: 0, rle: 'o!' }]
      };

      const result = ChallengeService.processChallengeData(rawData, '1');

      expect(result.description).toBe('');
    });
  });

  describe('storage methods', () => {
    test('should save challenge to localStorage', () => {
      const challengeData = { name: 'Test', patterns: [] };

      ChallengeService.saveChallengeToStorage('1', challengeData);

      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'challenge_1',
        JSON.stringify(challengeData)
      );
    });

    test('should clear challenge from localStorage', () => {
      ChallengeService.clearChallengeFromStorage('1');

      expect(global.localStorage.removeItem).toHaveBeenCalledWith('challenge_1');
    });

    test('should handle storage errors gracefully', () => {
      global.localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        ChallengeService.saveChallengeToStorage('1', {});
      }).not.toThrow();
    });
  });
});
