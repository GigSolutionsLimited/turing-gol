// Simple test to verify Jest is working
describe('Basic Jest Test', () => {
  test('should add numbers correctly', () => {
    expect(2 + 2).toBe(4);
  });

  test('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr).toContain(2);
  });

  test('should verify Conway rules manually', () => {
    // Simple Conway's Game of Life test without imports
    function countNeighbors(grid, x, y) {
      const directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      let count = 0;
      const height = grid.length;
      const width = grid[0].length;

      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          count += grid[ny][nx];
        }
      }
      return count;
    }

    // Test neighbor counting
    const grid = [
      [1, 1, 0],
      [1, 0, 0],
      [0, 0, 0]
    ];

    const neighbors = countNeighbors(grid, 1, 1); // Center cell
    expect(neighbors).toBe(3); // Should have 3 neighbors
  });
});
