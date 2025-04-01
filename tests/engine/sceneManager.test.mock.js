export const mockSceneManager = {
  update: jest.fn(),
  render: jest.fn(),
  addScene: jest.fn(),
  switchToScene: jest.fn(),
  currentScene: null,
  transitioning: false
};
