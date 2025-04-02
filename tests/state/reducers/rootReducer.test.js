import { rootReducer } from '../../../src/js/state/reducers/rootReducer';
import { RESET_STATE, LOAD_STATE } from '../../../src/js/state/actions/actionTypes';

// Mock initial states for each reducer
const INITIAL_STATES = {
  ui: {},
  player: {},
  combat: { enemies: [] },
  patients: { waiting: [], treated: [] }
};

// Mock the individual reducers
jest.mock('../../../src/js/state/reducers/uiReducer', () => ({
  uiReducer: jest.fn((state) => state ?? {})
}));

jest.mock('../../../src/js/state/reducers/playerReducer', () => ({
  playerReducer: jest.fn((state) => state ?? {})
}));

jest.mock('../../../src/js/state/reducers/combatReducer', () => ({
  combatReducer: jest.fn((state) => state ?? { enemies: [] })
}));

jest.mock('../../../src/js/state/reducers/patientsReducer', () => ({
  patientsReducer: jest.fn((state) => state ?? { waiting: [], treated: [] })
}));

// Import mocked reducers
const { uiReducer } = require('../../../src/js/state/reducers/uiReducer');
const { playerReducer } = require('../../../src/js/state/reducers/playerReducer');
const { combatReducer } = require('../../../src/js/state/reducers/combatReducer');
const { patientsReducer } = require('../../../src/js/state/reducers/patientsReducer');

describe('rootReducer', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
      ui: { theme: 'dark' },
      player: { health: 100 },
      combat: { enemies: [{ id: 1 }] },
      patients: {
        waiting: [{ id: 1 }],
        treated: [{ id: 2 }]
      }
    };

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    uiReducer.mockImplementation((state) => state ?? {});
    playerReducer.mockImplementation((state) => state ?? {});
    combatReducer.mockImplementation((state) => state ?? { enemies: [] });
    patientsReducer.mockImplementation((state) => state ?? { waiting: [], treated: [] });
  });

  describe('base functionality', () => {
    test('initializes with empty state', () => {
      const result = rootReducer(undefined, { type: '@@INIT' });
      expect(result).toBeDefined();
      expect(result.combat.enemies).toEqual([]);
      expect(result.patients.waiting).toEqual([]);
      expect(result.patients.treated).toEqual([]);
      expect(Object.isFrozen(result.combat.enemies)).toBe(true);
      expect(Object.isFrozen(result.patients.waiting)).toBe(true);
      expect(Object.isFrozen(result.patients.treated)).toBe(true);
    });

    test('passes actions to individual reducers', () => {
      const action = { type: 'TEST_ACTION' };
      rootReducer(initialState, action);

      expect(uiReducer).toHaveBeenCalledWith(initialState.ui, action);
      expect(playerReducer).toHaveBeenCalledWith(initialState.player, action);
      expect(combatReducer).toHaveBeenCalledWith(initialState.combat, action);
      expect(patientsReducer).toHaveBeenCalledWith(initialState.patients, action);
    });

    test('ensures array immutability in state', () => {
      const state = rootReducer(initialState, { type: 'TEST' });
      
      expect(Object.isFrozen(state.combat.enemies)).toBe(true);
      expect(Object.isFrozen(state.patients.waiting)).toBe(true);
      expect(Object.isFrozen(state.patients.treated)).toBe(true);
      
      expect(() => {
        state.combat.enemies.push({ id: 2 });
      }).toThrow();
      
      expect(() => {
        state.patients.waiting.push({ id: 3 });
      }).toThrow();
      
      expect(() => {
        state.patients.treated.push({ id: 4 });
      }).toThrow();
    });
  });

  describe('special actions', () => {
    test('handles RESET_STATE', () => {
      const result = rootReducer(initialState, { type: RESET_STATE });

      // Verify reducers were called with undefined state
      expect(uiReducer).toHaveBeenCalledWith(undefined, { type: RESET_STATE });
      expect(playerReducer).toHaveBeenCalledWith(undefined, { type: RESET_STATE });
      expect(combatReducer).toHaveBeenCalledWith(undefined, { type: RESET_STATE });
      expect(patientsReducer).toHaveBeenCalledWith(undefined, { type: RESET_STATE });

      // Verify result matches initial states
      expect(result).toEqual({
        ui: {},
        player: {},
        combat: { enemies: [] },
        patients: { waiting: [], treated: [] }
      });

      // Verify arrays are frozen
      expect(Object.isFrozen(result.combat.enemies)).toBe(true);
      expect(Object.isFrozen(result.patients.waiting)).toBe(true);
      expect(Object.isFrozen(result.patients.treated)).toBe(true);
    });

    test('handles LOAD_STATE with valid payload', () => {
      const savedState = {
        ui: { theme: 'light' },
        player: { health: 50 },
        combat: {
          enemies: [{ id: 3 }],
          status: 'active'
        },
        patients: {
          waiting: [{ id: 4 }],
          treated: [{ id: 5 }],
          status: 'busy'
        }
      };

      const result = rootReducer(initialState, {
        type: LOAD_STATE,
        payload: savedState
      });

      // Verify loaded state matches payload
      expect(result.ui).toEqual(savedState.ui);
      expect(result.player).toEqual(savedState.player);
      expect(result.combat.enemies).toEqual(savedState.combat.enemies);
      expect(result.combat.status).toBe('active');
      expect(result.patients.waiting).toEqual(savedState.patients.waiting);
      expect(result.patients.treated).toEqual(savedState.patients.treated);
      expect(result.patients.status).toBe('busy');

      // Verify arrays are frozen
      expect(Object.isFrozen(result.combat.enemies)).toBe(true);
      expect(Object.isFrozen(result.patients.waiting)).toBe(true);
      expect(Object.isFrozen(result.patients.treated)).toBe(true);
    });

    test('handles LOAD_STATE with missing arrays', () => {
      const incompleteState = {
        ui: { theme: 'light' },
        player: { health: 50 },
        combat: {},
        patients: {}
      };

      const result = rootReducer(initialState, {
        type: LOAD_STATE,
        payload: incompleteState
      });

      expect(result.combat.enemies).toEqual([]);
      expect(result.patients.waiting).toEqual([]);
      expect(result.patients.treated).toEqual([]);
      expect(Object.isFrozen(result.combat.enemies)).toBe(true);
      expect(Object.isFrozen(result.patients.waiting)).toBe(true);
      expect(Object.isFrozen(result.patients.treated)).toBe(true);
    });

    test('ignores LOAD_STATE without payload', () => {
      const result = rootReducer(initialState, { type: LOAD_STATE });
      
      // Verify state structure is preserved
      expect(result.ui).toEqual(initialState.ui);
      expect(result.player).toEqual(initialState.player);
      expect(result.combat.enemies).toEqual(initialState.combat.enemies);
      expect(result.patients.waiting).toEqual(initialState.patients.waiting);
      expect(result.patients.treated).toEqual(initialState.patients.treated);

      // Verify arrays are frozen
      expect(Object.isFrozen(result.combat.enemies)).toBe(true);
      expect(Object.isFrozen(result.patients.waiting)).toBe(true);
      expect(Object.isFrozen(result.patients.treated)).toBe(true);
    });
  });
});