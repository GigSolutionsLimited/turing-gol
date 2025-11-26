// Test configuration and setup
// Mock global objects for testing
global.console = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 2000 * 1024 * 1024
  }
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  return setTimeout(callback, 16); // ~60fps
});

global.cancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

global.localStorage = localStorageMock;

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock window object
global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock document object for canvas tests
global.document = {
  createElement: jest.fn(() => ({
    getContext: jest.fn(() => ({
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      createImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(800 * 600 * 4),
        width: 800,
        height: 600
      })),
      putImageData: jest.fn(),
      imageSmoothingEnabled: true,
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1
    })),
    width: 800,
    height: 600,
    style: {},
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  })),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};


// Helper function to reset all mocks
global.resetMocks = () => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  global.fetch.mockClear();
};

// Helper function to create mock canvas context
global.createMockCanvasContext = () => ({
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  createImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(800 * 600 * 4),
    width: 800,
    height: 600
  })),
  putImageData: jest.fn(),
  imageSmoothingEnabled: true,
  fillStyle: '#000000',
  strokeStyle: '#000000',
  lineWidth: 1
});

// Helper function to create mock patterns for testing
global.createMockPattern = (name, coordinates) => ({
  name,
  pattern: coordinates || [[0, 0], [0, 1], [1, 0]],
  width: 3,
  height: 3,
  rle: '2o$o!'
});

// Helper function to create test grids
global.createTestGrid = (width, height, pattern = null) => {
  const grid = Array.from({ length: height }, () => Array(width).fill(0));

  if (pattern) {
    pattern.forEach(([y, x]) => {
      if (y >= 0 && y < height && x >= 0 && x < width) {
        grid[y][x] = 1;
      }
    });
  }

  return grid;
};

// Setup test timeout
jest.setTimeout(10000);

