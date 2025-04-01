export const mockGameLoop = {
  start: jest.fn(),
  stop: jest.fn(),
  update: jest.fn(),
  isRunning: false,
  running: false,
  lastTimestamp: 0,
  deltaTime: 0,
  fixedDeltaTime: 1/60
};
