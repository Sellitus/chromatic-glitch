/**
 * Implements a Redux-style store for centralized state management.
 */
class Store {
  constructor(rootReducer, initialState = {}, middleware = []) {
    this.rootReducer = rootReducer;
    this.listeners = new Set();
    this.isDispatching = false;
    
    // Cache for memoization
    this.stateCache = {
      hash: '',
      value: null
    };

    // Initialize with base state structure
    const defaultState = {
      ui: { screen: 'title' },
      player: { health: 100, maxHealth: 100, mana: 100, maxMana: 100 },
      combat: { active: false, enemies: [], turn: 0 },
      patients: {
        waiting: [],
        current: null,
        treated: [],
        stats: {
          healed: 0,
          cardsPlayed: 0,
          damageDealt: 0,
          healingDone: 0
        }
      }
    };

    // Initialize state and ensure it's frozen
    const merged = { ...defaultState, ...initialState };
    const initialized = this.rootReducer(merged, { type: '@@STORE/INIT' });
    const frozen = this.deepFreeze(this.deepClone(initialized));
    this.state = frozen;

    // Initialize cache with frozen state
    const stateHash = JSON.stringify(frozen);
    this.stateCache = {
      hash: stateHash,
      value: frozen
    };

    // Compose middleware into a chain
    const middlewareAPI = {
      getState: this.getState.bind(this),
      dispatch: (action) => this.dispatch(action)
    };

    const chain = middleware.map(m => m(middlewareAPI));
    this.dispatch = this.composeMiddleware(chain)(this.dispatch.bind(this));
  }

  composeMiddleware(middlewares) {
    return (next) => {
      if (middlewares.length === 0) return next;
      if (middlewares.length === 1) return middlewares[0](next);
      return middlewares.reduce((a, b) => (...args) => a(b(...args)))(next);
    };
  }

  getState() {
    if (this.isDispatching) {
      throw new Error('You may not call store.getState() while the reducer is executing.');
    }

    // Return cached state if hash matches
    const stateHash = JSON.stringify(this.state);
    if (this.stateCache.hash === stateHash && this.stateCache.value) {
      return this.stateCache.value;
    }

    // Create new deeply frozen state
    const nextState = this.deepClone(this.state);
    const frozenState = this.deepFreeze(nextState);

    // Update cache
    this.stateCache = {
      hash: stateHash,
      value: frozenState
    };

    return frozenState;
  }

  deepFreeze(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // First freeze any nested objects/arrays
    if (Array.isArray(obj)) {
      const frozenArray = obj.map(item => this.deepFreeze(item));
      return Object.freeze(frozenArray);
    }

    const frozenObj = {};
    Object.entries(obj).forEach(([key, value]) => {
      frozenObj[key] = this.deepFreeze(value);
    });

    return Object.freeze(frozenObj);
  }

  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  dispatch(action) {
    if (!action || typeof action !== 'object' || !action.type) {
      throw new Error('Actions must be plain objects with a type property.');
    }

    if (this.isDispatching) {
      throw new Error('Reducers may not dispatch actions.');
    }

    try {
      this.isDispatching = true;
      const nextState = this.rootReducer(this.state, action);
      const frozenState = this.deepFreeze(this.deepClone(nextState));
      this.state = frozenState;
      
      // Update cache
      const stateHash = JSON.stringify(frozenState);
      this.stateCache = {
        hash: stateHash,
        value: frozenState
      };
    } finally {
      this.isDispatching = false;
    }

    // Notify listeners
    this.listeners.forEach(listener => listener());

    return action;
  }

  subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected the listener to be a function.');
    }

    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.');
    }

    this.rootReducer = nextReducer;
    this.dispatch({ type: '@@store/REPLACE' });
  }
}

export { Store };
