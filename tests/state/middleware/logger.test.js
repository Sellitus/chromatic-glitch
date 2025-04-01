import { Store } from '../../../src/js/state/store';
import { rootReducer } from '../../../src/js/state/reducers/rootReducer';
import { createLogger, createTimingMiddleware } from '../../../src/js/state/middleware/logger';

describe('Logger Middleware', () => {
  let store;
  let consoleSpy;
  
  beforeEach(() => {
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      group: jest.spyOn(console, 'group').mockImplementation(),
      groupCollapsed: jest.spyOn(console, 'groupCollapsed').mockImplementation(),
      groupEnd: jest.spyOn(console, 'groupEnd').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createLogger', () => {
    beforeEach(() => {
      store = new Store(rootReducer, {}, [createLogger()]);
    });

    it('logs actions and state changes', () => {
      const action = { type: 'TEST_ACTION', payload: 'test' };
      store.dispatch(action);

      expect(consoleSpy.group).toHaveBeenCalledWith(
        '%cAction: %cTEST_ACTION',
        expect.any(String),
        expect.any(String)
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Previous State:'),
        expect.any(String),
        expect.any(Object)
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Action:'),
        expect.any(String),
        action
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Next State:'),
        expect.any(String),
        expect.any(Object)
      );
      expect(consoleSpy.groupEnd).toHaveBeenCalled();
    });

    it('shows diff when state changes', () => {
      store.dispatch({ type: 'UPDATE_UI', screen: 'game' });
      
      expect(consoleSpy.groupCollapsed).toHaveBeenCalledWith('State Changes');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('ui:'),
        expect.any(String),
        expect.any(Object),
        '→',
        expect.any(Object)
      );
    });
  });

  describe('createTimingMiddleware', () => {
    let performanceNow;

    beforeEach(() => {
      let time = 0;
      performanceNow = jest.spyOn(performance, 'now').mockImplementation(() => {
        const currentTime = time;
        time += 5; // Increment by 5ms for each call
        return currentTime;
      });
      store = new Store(rootReducer, {}, [createTimingMiddleware()]);
    });

    afterEach(() => {
      performanceNow.mockRestore();
    });

    it('warns for slow actions', () => {
      performanceNow.mockReturnValueOnce(0)    // First call returns 0
                    .mockReturnValueOnce(20);   // Second call returns 20, making duration 20ms

      store.dispatch({ type: 'SLOW_ACTION' });
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Action SLOW_ACTION took 20.00ms to process')
      );
    });

    it('does not warn for fast actions', () => {
      performanceNow.mockReturnValueOnce(0)    // First call returns 0
                    .mockReturnValueOnce(10);   // Second call returns 10, making duration 10ms

      store.dispatch({ type: 'FAST_ACTION' });
      
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });
  });
});
