import {
  createGameStore,
  setScreen,
  updatePlayerHealth,
  startCombat,
  addPatient,
  selectScreen,
  selectPlayerHealth,
  selectCombatActive,
  selectWaitingPatients,
  undo,
  redo
} from '../../src/js/state';

describe('Game Store', () => {
  let store;

  beforeEach(() => {
    store = createGameStore({ debug: false, persistence: false });
  });

  test('should initialize with default state', () => {
    const state = store.getState();
    expect(state).toHaveProperty('ui');
    expect(state).toHaveProperty('player');
    expect(state).toHaveProperty('combat');
    expect(state).toHaveProperty('patients');
  });

  test('should handle UI actions', () => {
    store.dispatch(setScreen('combat'));
    expect(selectScreen(store.getState())).toBe('combat');
  });

  test('should handle player actions', () => {
    const initialHealth = selectPlayerHealth(store.getState());
    store.dispatch(updatePlayerHealth(-20));
    expect(selectPlayerHealth(store.getState())).toBe(initialHealth - 20);
  });

  test('should handle combat actions', () => {
    const enemies = [
      { id: '1', name: 'Enemy 1', health: 100 },
      { id: '2', name: 'Enemy 2', health: 100 }
    ];
    store.dispatch(startCombat(enemies));
    expect(selectCombatActive(store.getState())).toBe(true);
  });

  test('should handle patient actions', () => {
    const patient = { id: '1', name: 'Patient 1', condition: 'Test' };
    store.dispatch(addPatient(patient));
    const patients = selectWaitingPatients(store.getState());
    expect(patients).toHaveLength(1);
    expect(patients[0]).toEqual(patient);
  });

  describe('History Middleware', () => {
    beforeEach(() => {
      store = createGameStore({ debug: false, persistence: false, history: true });
    });

    test('should support undo/redo operations', () => {
      const initialScreen = selectScreen(store.getState());
      
      // Make some changes
      store.dispatch(setScreen('combat'));
      store.dispatch(setScreen('inventory'));
      
      // Undo twice
      store.dispatch(undo());
      store.dispatch(undo());
      expect(selectScreen(store.getState())).toBe(initialScreen);
      
      // Redo once
      store.dispatch(redo());
      expect(selectScreen(store.getState())).toBe('combat');
    });
  });

  describe('State Immutability', () => {
    test('should maintain state immutability', () => {
      // Get initial state directly through selector
      const initialPatients = selectWaitingPatients(store.getState());
      
      // Attempt to modify array directly
      try {
        initialPatients.push({ id: 'test', name: 'Test' });
        fail('Should not be able to modify frozen array');
      } catch (e) {
        expect(e).toBeInstanceOf(TypeError);
      }
      
      // Verify state wasn't modified
      expect(selectWaitingPatients(store.getState())).toEqual(initialPatients);
    });
  });

  describe('Complex State Changes', () => {
    test('should handle multiple related actions correctly', () => {
      // Start combat
      const enemies = [{ id: '1', name: 'Enemy', health: 100 }];
      store.dispatch(startCombat(enemies));
      
      // Take damage
      const initialHealth = selectPlayerHealth(store.getState());
      store.dispatch(updatePlayerHealth(-30));
      
      // Verify both combat and player state updated correctly
      const state = store.getState();
      expect(selectCombatActive(state)).toBe(true);
      expect(selectPlayerHealth(state)).toBe(initialHealth - 30);
    });
  });

  describe('Selector Memoization', () => {
    test('should not recompute derived data unnecessarily', () => {
      // Get initial patients
      const patients1 = selectWaitingPatients(store.getState());
      
      // Get patients again without state change
      const patients2 = selectWaitingPatients(store.getState());
      
      // References should be the same since state hasn't changed
      expect(patients1).toBe(patients2);
      
      // Add patient and verify reference changes
      store.dispatch(addPatient({ id: '1', name: 'Patient 1', condition: 'Test' }));
      const patients3 = selectWaitingPatients(store.getState());
      expect(patients3).not.toBe(patients2);
    });
  });
});
