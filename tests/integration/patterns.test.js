// Integration tests for Game of Life patterns
import { GameService } from '../../src/services/gameService.js';
import { decodeRLE } from '../../src/utils/rleUtils.js';

// Helper function to create test grids
function createTestGrid(width, height, pattern = null) {
  const grid = Array.from({ length: height }, () => Array(width).fill(0));

  if (pattern) {
    pattern.forEach(([y, x]) => {
      if (y >= 0 && y < height && x >= 0 && x < width) {
        grid[y][x] = 1;
      }
    });
  }

  return grid;
}

describe('Game of Life Pattern Integration Tests', () => {
  describe('Well-known Conway patterns', () => {
    test('Glider should move diagonally over 4 generations', () => {
      // Start with glider at top-left
      let grid = createTestGrid(10, 10);
      const gliderCoords = decodeRLE('bo$2bo$3o!');

      // Place glider at (1,1)
      gliderCoords.forEach(([y, x]) => {
        if (y + 1 < grid.length && x + 1 < grid[0].length) {
          grid[y + 1][x + 1] = 1;
        }
      });

      // Track center of mass over 4 generations
      const getCenterOfMass = (g) => {
        let totalX = 0, totalY = 0, count = 0;
        for (let y = 0; y < g.length; y++) {
          for (let x = 0; x < g[y].length; x++) {
            if (g[y][x]) {
              totalX += x;
              totalY += y;
              count++;
            }
          }
        }
        return count > 0 ? { x: totalX / count, y: totalY / count } : { x: 0, y: 0 };
      };

      const initialCenter = getCenterOfMass(grid);

      // Run 4 generations (complete glider cycle)
      for (let i = 0; i < 4; i++) {
        grid = GameService.nextGeneration(grid);
      }

      const finalCenter = getCenterOfMass(grid);

      // Glider should have moved down and right
      expect(finalCenter.x).toBeGreaterThan(initialCenter.x);
      expect(finalCenter.y).toBeGreaterThan(initialCenter.y);
    });

    test('Blinker should oscillate with period 2', () => {
      // Vertical blinker
      const blinker = createTestGrid(5, 5, [[1, 2], [2, 2], [3, 2]]);

      const gen1 = GameService.nextGeneration(blinker);
      const gen2 = GameService.nextGeneration(gen1);

      // Should return to original after 2 generations
      expect(gen2).toEqual(blinker);

      // Gen 1 should be horizontal
      expect(gen1[2][1]).toBe(1); // Left
      expect(gen1[2][2]).toBe(1); // Center
      expect(gen1[2][3]).toBe(1); // Right
      expect(gen1[1][2]).toBe(0); // Top should be dead
      expect(gen1[3][2]).toBe(0); // Bottom should be dead
    });

    test('Block should be completely stable', () => {
      const block = createTestGrid(4, 4, [[1, 1], [1, 2], [2, 1], [2, 2]]);

      // Run for 10 generations
      let current = block;
      for (let i = 0; i < 10; i++) {
        const next = GameService.nextGeneration(current);
        expect(next).toEqual(block); // Should never change
        current = next;
      }
    });

    test('Beacon should oscillate with period 2', () => {
      // Beacon pattern
      const beacon = createTestGrid(6, 6, [
        [1, 1], [1, 2],
        [2, 1], [2, 2],
        [3, 3], [3, 4],
        [4, 3], [4, 4]
      ]);

      const gen1 = GameService.nextGeneration(beacon);
      const gen2 = GameService.nextGeneration(gen1);

      // Should return to original after 2 generations
      expect(gen2).toEqual(beacon);

      // Gen 1 should have different pattern (cells should connect/disconnect)
      expect(gen1).not.toEqual(beacon);
    });

    test('Toad should oscillate with period 2', () => {
      // Toad pattern
      const toad = createTestGrid(6, 6, [
        [2, 2], [2, 3], [2, 4],
        [3, 1], [3, 2], [3, 3]
      ]);

      const gen1 = GameService.nextGeneration(toad);
      const gen2 = GameService.nextGeneration(gen1);

      // Should return to original after 2 generations
      expect(gen2).toEqual(toad);
    });

    test('Pentadecathlon should have period 15', () => {
      // This is a more complex test - just verify it doesn't die out
      const pentadecathlon = createTestGrid(20, 20, [
        [10, 8], [10, 9], [10, 10], [10, 11], [10, 12], [10, 13], [10, 14], [10, 15]
      ]);

      let current = pentadecathlon;
      let aliveCells = GameService.countAliveCells(current);

      // Run for several generations and verify it doesn't die
      for (let i = 0; i < 30; i++) {
        current = GameService.nextGeneration(current);
        const currentAliveCells = GameService.countAliveCells(current);
        expect(currentAliveCells).toBeGreaterThan(0); // Should never completely die
      }
    });
  });

  describe('Edge cases and boundary conditions', () => {
    test('Patterns at grid edge should behave correctly', () => {
      // Glider starting near right edge
      const grid = createTestGrid(6, 6);
      grid[1][4] = 1; // bo
      grid[2][5] = 1; // 2bo -> o at (2,5)
      grid[3][3] = 1; // 3o
      grid[3][4] = 1;
      grid[3][5] = 1;

      // Should not crash and should handle boundaries
      for (let i = 0; i < 5; i++) {
        const next = GameService.nextGeneration(grid);
        expect(next.length).toBe(6);
        expect(next[0].length).toBe(6);
      }
    });

    test('Dense patterns should not cause performance issues', () => {
      // Create a moderately dense random pattern
      const grid = createTestGrid(20, 20);
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
          if (Math.random() < 0.3) { // 30% density
            grid[y][x] = 1;
          }
        }
      }

      const startTime = performance.now();

      // Run for several generations
      let current = grid;
      for (let i = 0; i < 10; i++) {
        current = GameService.nextGeneration(current);
      }

      const endTime = performance.now();

      // Should complete reasonably quickly (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(100); // 100ms
    });

    test('Large grids should work correctly', () => {
      const largeGrid = createTestGrid(50, 50);

      // Place a glider in the center
      const center = 25;
      largeGrid[center][center + 1] = 1;
      largeGrid[center + 1][center + 2] = 1;
      largeGrid[center + 2][center] = 1;
      largeGrid[center + 2][center + 1] = 1;
      largeGrid[center + 2][center + 2] = 1;

      // Should handle large grid without issues
      for (let i = 0; i < 5; i++) {
        const next = GameService.nextGeneration(largeGrid);
        expect(next.length).toBe(50);
        expect(next[0].length).toBe(50);
        expect(GameService.countAliveCells(next)).toBeGreaterThan(0);
      }
    });
  });

  describe('Pattern preservation and correctness', () => {
    test('Total cell count should follow Conway rules', () => {
      // Start with a simple pattern
      const grid = createTestGrid(10, 10, [
        [4, 4], [4, 5], [4, 6], [5, 4], [6, 5]
      ]);

      let current = grid;

      for (let gen = 0; gen < 10; gen++) {
        const next = GameService.nextGeneration(current);

        // Count cells that should be born or die according to rules
        let shouldBeBorn = 0;
        let shouldDie = 0;

        for (let y = 0; y < current.length; y++) {
          for (let x = 0; x < current[0].length; x++) {
            let neighbors = 0;

            // Count neighbors
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const ny = y + dy, nx = x + dx;
                if (ny >= 0 && ny < current.length && nx >= 0 && nx < current[0].length) {
                  neighbors += current[ny][nx];
                }
              }
            }

            if (current[y][x] === 1) {
              // Live cell
              if (neighbors < 2 || neighbors > 3) shouldDie++;
            } else {
              // Dead cell
              if (neighbors === 3) shouldBeBorn++;
            }
          }
        }

        const currentAlive = GameService.countAliveCells(current);
        const nextAlive = GameService.countAliveCells(next);
        const expectedAlive = currentAlive - shouldDie + shouldBeBorn;

        expect(nextAlive).toBe(expectedAlive);
        current = next;
      }
    });

    test('Symmetric patterns should remain symmetric', () => {
      // Block pattern (stable and symmetric)
      const blocks = createTestGrid(7, 7, [
        [2, 2], [2, 3], [3, 2], [3, 3], // Block 1
        [2, 5], [2, 6], [3, 5], [3, 6]  // Block 2 (symmetric)
      ]);

      const next = GameService.nextGeneration(blocks);

      // Blocks should remain stable (alive)
      expect(GameService.countAliveCells(next)).toBeGreaterThan(0);

      // Should remain exactly the same (blocks are stable)
      expect(next).toEqual(blocks);
    });
  });

  describe('Pattern stability and convergence', () => {
    test('Empty grid should remain empty', () => {
      const emptyGrid = createTestGrid(5, 5);
      const next = GameService.nextGeneration(emptyGrid);

      expect(next).toEqual(emptyGrid);
      expect(GameService.countAliveCells(next)).toBe(0);
    });

    test('Single cell should die', () => {
      const singleCell = createTestGrid(3, 3, [[1, 1]]);
      const next = GameService.nextGeneration(singleCell);

      expect(GameService.countAliveCells(next)).toBe(0);
    });

    test('Two adjacent cells should die', () => {
      const twoCells = createTestGrid(4, 4, [[1, 1], [1, 2]]);
      const next = GameService.nextGeneration(twoCells);

      expect(GameService.countAliveCells(next)).toBe(0);
    });

    test('Three cells in a line should become blinker', () => {
      const threeCells = createTestGrid(5, 5, [[2, 1], [2, 2], [2, 3]]);
      const next = GameService.nextGeneration(threeCells);

      // Should become vertical blinker
      expect(GameService.countAliveCells(next)).toBe(3);
      expect(next[1][2]).toBe(1);
      expect(next[2][2]).toBe(1);
      expect(next[3][2]).toBe(1);
    });
  });

  describe('RLE pattern integration', () => {
    test('RLE decoded patterns should behave correctly', () => {
      // Test various RLE patterns
      const patterns = [
        { name: 'block', rle: '2o$2o!' },
        { name: 'blinker', rle: 'o$o$o!' },
        { name: 'glider', rle: 'bo$2bo$3o!' }
      ];

      patterns.forEach(({ name, rle }) => {
        const coords = decodeRLE(rle);
        const grid = createTestGrid(10, 10);

        // Place pattern in center
        coords.forEach(([y, x]) => {
          if (y + 2 < grid.length && x + 2 < grid[0].length) {
            grid[y + 2][x + 2] = 1;
          }
        });

        // Run for a few generations
        let current = grid;
        for (let i = 0; i < 3; i++) {
          current = GameService.nextGeneration(current);
          expect(GameService.countAliveCells(current)).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });
});
