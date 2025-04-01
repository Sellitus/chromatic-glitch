const { GameState } = require('../src/js/engine/gameState');

describe('GameState', () => {
  describe('initialization', () => {
    it('should call resetState when initialized', () => {
      const gameState = new GameState();
      gameState.state.player.health = 50;
      gameState.init();
      expect(gameState.getPlayer().health).toBe(100);
    });
  });

  let gameState;

  beforeEach(() => {
    gameState = new GameState();
  });

  it('should initialize with default values', () => {
    expect(gameState).toBeDefined();
    expect(gameState.getState()).toEqual({
      screen: 'title',
      player: {
        health: 100,
        maxHealth: 100,
        mana: 50,
        maxMana: 50,
        deck: [],
        hand: [],
        effects: []
      },
      combat: {
        active: false,
        turn: 0,
        enemies: [],
        activeCard: null,
        selectedTarget: null
      },
      patients: {
        waiting: [],
        current: null,
        treated: 0
      },
      stats: {
        patientsHealed: 0,
        cardsPlayed: 0,
        damageDealt: 0,
        healingDone: 0
      }
    });
  });

  describe('state management', () => {
    it('should update state correctly', () => {
      const newState = {
        screen: 'game'
      };
      gameState.updateState(newState);
      expect(gameState.getState().screen).toBe('game');
    });

    it('should reset state correctly', () => {
      gameState.updateState({
        player: {
          health: 50,
          maxHealth: 100,
          mana: 25,
          maxMana: 50,
          deck: ['card1'],
          hand: ['card2'],
          effects: ['effect1']
        },
        combat: {
          active: true,
          turn: 5,
          enemies: ['enemy1'],
          activeCard: 'card3',
          selectedTarget: 'target1'
        }
      });

      gameState.resetState();
      const state = gameState.getState();
      expect(state.player.health).toBe(100);
      expect(state.player.mana).toBe(50);
      expect(state.player.hand).toEqual([]);
      expect(state.player.effects).toEqual([]);
      expect(state.combat.active).toBe(false);
      expect(state.combat.enemies).toEqual([]);
      expect(state.combat.activeCard).toBeNull();
      expect(state.combat.selectedTarget).toBeNull();
    });
  });

  describe('screen management', () => {
    it('should get and set screen correctly', () => {
      gameState.setScreen('combat');
      expect(gameState.getScreen()).toBe('combat');
    });
  });

  describe('player management', () => {
    it('should get player state', () => {
      expect(gameState.getPlayer()).toEqual({
        health: 100,
        maxHealth: 100,
        mana: 50,
        maxMana: 50,
        deck: [],
        hand: [],
        effects: []
      });
    });

    it('should update player health within bounds', () => {
      gameState.updatePlayerHealth(-30);
      expect(gameState.getPlayer().health).toBe(70);

      gameState.updatePlayerHealth(50);
      expect(gameState.getPlayer().health).toBe(100);

      gameState.updatePlayerHealth(-150);
      expect(gameState.getPlayer().health).toBe(0);
    });

    it('should update player mana within bounds', () => {
      gameState.updatePlayerMana(-20);
      expect(gameState.getPlayer().mana).toBe(30);

      gameState.updatePlayerMana(30);
      expect(gameState.getPlayer().mana).toBe(50);

      gameState.updatePlayerMana(-60);
      expect(gameState.getPlayer().mana).toBe(0);
    });

    it('should manage player hand correctly', () => {
      const card = { id: 'card1', name: 'Test Card' };
      gameState.addCardToHand(card);
      expect(gameState.getPlayer().hand).toContainEqual(card);

      gameState.removeCardFromHand('card1');
      expect(gameState.getPlayer().hand).not.toContainEqual(card);
    });
  });

  describe('combat management', () => {
    it('should get combat state', () => {
      expect(gameState.getCombat()).toEqual({
        active: false,
        turn: 0,
        enemies: [],
        activeCard: null,
        selectedTarget: null
      });
    });

    it('should start combat correctly', () => {
      const enemies = [{ id: 'enemy1', health: 50 }];
      gameState.startCombat(enemies);
      expect(gameState.getCombat().active).toBe(true);
      expect(gameState.getCombat().enemies).toEqual(enemies);
      expect(gameState.getCombat().turn).toBe(0);
    });

    it('should end combat correctly', () => {
      gameState.startCombat([{ id: 'enemy1', health: 50 }]);
      gameState.endCombat();
      expect(gameState.getCombat().active).toBe(false);
      expect(gameState.getCombat().enemies).toEqual([]);
      expect(gameState.getCombat().activeCard).toBeNull();
      expect(gameState.getCombat().selectedTarget).toBeNull();
    });
  });

  describe('patient management', () => {
    it('should get patients state', () => {
      expect(gameState.getPatients()).toEqual({
        waiting: [],
        current: null,
        treated: 0
      });
    });
  });

  describe('stats management', () => {
    it('should get stats', () => {
      expect(gameState.getStats()).toEqual({
        patientsHealed: 0,
        cardsPlayed: 0,
        damageDealt: 0,
        healingDone: 0
      });
    });
  });
});
