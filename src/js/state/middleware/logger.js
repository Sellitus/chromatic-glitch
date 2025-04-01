/**
 * Creates a middleware that logs actions and state changes
 * @param {Object} options - Logger options
 * @param {boolean} options.diff - Whether to show state changes
 * @returns {Function} Redux-style middleware
 */
export const createLogger = ({ diff = true } = {}) => {
  return store => next => action => {
    const prevState = store.getState();
    console.group(
      `%cAction: %c${action.type}`,
      'color: gray; font-weight: lighter;',
      'color: inherit; font-weight: bold;'
    );
    
    console.log('%cPrevious State:', 'color: #9E9E9E', prevState);
    console.log('%cAction:', 'color: #03A9F4', action);
    
    const result = next(action);
    const nextState = store.getState();
    console.log('%cNext State:', 'color: #4CAF50', nextState);
    
    if (diff) {
      console.groupCollapsed('State Changes');
      Object.keys(nextState).forEach(key => {
        if (prevState[key] !== nextState[key]) {
          console.log(
            `%c${key}:`,
            'font-weight: bold;',
            prevState[key],
            '→',
            nextState[key]
          );
        }
      });
      console.groupEnd();
    }
    
    console.groupEnd();
    return result;
  };
};

/**
 * Creates a middleware that crashes on any state mutations
 * This helps enforce immutability during development
 */
export const createImmutableStateInvariantMiddleware = () => {
  const freeze = (obj) => {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach((prop) => {
      if (
        obj[prop] !== null &&
        (typeof obj[prop] === 'object' || typeof obj[prop] === 'function') &&
        !Object.isFrozen(obj[prop])
      ) {
        freeze(obj[prop]);
      }
    });
    return obj;
  };

  return store => next => action => {
    freeze(store.getState());
    try {
      return next(action);
    } finally {
      freeze(store.getState());
    }
  };
};

/**
 * Creates a middleware that tracks action timing
 */
export const createTimingMiddleware = () => {
  return () => next => action => {
    const start = performance.now();
    const result = next(action);
    const duration = performance.now() - start;
    
    if (duration > 16) { // Warn if action takes longer than one frame (16ms)
      console.warn(
        `Action ${action.type} took ${duration.toFixed(2)}ms to process. ` +
        'Consider optimizing this action.'
      );
    }
    
    return result;
  };
};
