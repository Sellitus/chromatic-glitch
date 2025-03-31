const { GameState } = require('../src/js/engine/gameState');

describe('GameState', () => {
  it('should initialize', () => {
    const gameState = new GameState();
    expect(gameState).toBeDefined();
  });
});
