import TimerComponent from '../../../src/js/ecs/components/TimerComponent.js';

// Mock performance.now() for consistent testing
const mockNow = jest.spyOn(performance, 'now');
let currentTime = 0;
mockNow.mockImplementation(() => currentTime);

describe('TimerComponent', () => {
  let timer;

  beforeEach(() => {
    timer = new TimerComponent();
    currentTime = 0;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('timer creation', () => {
    test('creates timer with required options', () => {
      const result = timer.addTimer('test', { duration: 1000 });
      
      expect(result).toBeDefined();
      expect(result.duration).toBe(1000);
      expect(result.elapsed).toBe(0);
      expect(result.startTime).toBe(0);
      expect(result.isRunning).toBe(true);
      expect(result.isLooping).toBe(false);
      expect(result.onComplete).toBeNull();
      expect(result.onTick).toBeNull();
    });

    test('creates timer with all options', () => {
      const onComplete = jest.fn();
      const onTick = jest.fn();
      
      const result = timer.addTimer('test', {
        duration: 1000,
        loop: true,
        onComplete,
        onTick
      });
      
      expect(result.duration).toBe(1000);
      expect(result.isLooping).toBe(true);
      expect(result.onComplete).toBe(onComplete);
      expect(result.onTick).toBe(onTick);
    });

    test('throws error for duplicate timer ID', () => {
      timer.addTimer('test', { duration: 1000 });
      expect(() => {
        timer.addTimer('test', { duration: 1000 });
      }).toThrow('Timer with id test already exists');
    });
  });

  describe('timer management', () => {
    beforeEach(() => {
      timer.addTimer('test', { duration: 1000 });
    });

    test('gets existing timer', () => {
      const result = timer.getTimer('test');
      expect(result).toBeDefined();
      expect(result.duration).toBe(1000);
    });

    test('returns null for non-existent timer', () => {
      expect(timer.getTimer('nonexistent')).toBeNull();
    });

    test('removes timer', () => {
      timer.removeTimer('test');
      expect(timer.getTimer('test')).toBeNull();
    });

    test('pauses running timer', () => {
      currentTime = 500;
      timer.pauseTimer('test');
      
      const result = timer.getTimer('test');
      expect(result.isRunning).toBe(false);
      expect(result.elapsed).toBe(500);
    });

    test('starts paused timer', () => {
      currentTime = 500;
      timer.pauseTimer('test');
      currentTime = 1000;
      timer.startTimer('test');
      
      const result = timer.getTimer('test');
      expect(result.isRunning).toBe(true);
      expect(result.startTime).toBe(500); // Current time - elapsed time
    });

    test('resets timer with start', () => {
      currentTime = 500;
      timer.resetTimer('test', true);
      
      const result = timer.getTimer('test');
      expect(result.elapsed).toBe(0);
      expect(result.startTime).toBe(500);
      expect(result.isRunning).toBe(true);
    });

    test('resets timer without start', () => {
      currentTime = 500;
      timer.resetTimer('test', false);
      
      const result = timer.getTimer('test');
      expect(result.elapsed).toBe(0);
      expect(result.startTime).toBe(500);
      expect(result.isRunning).toBe(false);
    });
  });

  describe('timer updates', () => {
    test('calls onTick callback', () => {
      const onTick = jest.fn();
      timer.addTimer('test', {
        duration: 1000,
        onTick
      });

      currentTime = 500;
      timer.onUpdate(16);

      expect(onTick).toHaveBeenCalledWith(0.5, 500); // 50% progress
    });

    test('calls onComplete callback', () => {
      const onComplete = jest.fn();
      timer.addTimer('test', {
        duration: 1000,
        onComplete
      });

      currentTime = 1000;
      timer.onUpdate(16);

      expect(onComplete).toHaveBeenCalled();
    });

    test('removes completed non-looping timer', () => {
      timer.addTimer('test', { duration: 1000 });
      currentTime = 1000;
      timer.onUpdate(16);

      expect(timer.getTimer('test')).toBeNull();
    });

    test('restarts completed looping timer', () => {
      timer.addTimer('test', {
        duration: 1000,
        loop: true
      });

      currentTime = 1000;
      timer.onUpdate(16);

      const result = timer.getTimer('test');
      expect(result).toBeDefined();
      expect(result.startTime).toBe(1000);
    });

    test('skips update for paused timer', () => {
      const onTick = jest.fn();
      timer.addTimer('test', {
        duration: 1000,
        onTick
      });

      timer.pauseTimer('test');
      currentTime = 500;
      timer.onUpdate(16);

      expect(onTick).not.toHaveBeenCalled();
    });
  });

  describe('serialization', () => {
    test('serializes empty state', () => {
      expect(timer.serialize()).toEqual({
        type: 'TimerComponent',
        timers: {}
      });
    });

    test('serializes with timers', () => {
      timer.addTimer('test1', { duration: 1000 });
      timer.addTimer('test2', { duration: 2000, loop: true });
      
      currentTime = 500;
      timer.pauseTimer('test1');

      expect(timer.serialize()).toEqual({
        type: 'TimerComponent',
        timers: {
          test1: {
            duration: 1000,
            elapsed: 500,
            isRunning: false,
            isLooping: false
          },
          test2: {
            duration: 2000,
            elapsed: 0,
            isRunning: true,
            isLooping: true
          }
        }
      });
    });

    test('deserializes empty state', () => {
      timer.addTimer('test', { duration: 1000 });
      timer.deserialize({ timers: {} });
      
      expect(timer.getTimer('test')).toBeNull();
    });

    test('deserializes with timers', () => {
      const data = {
        timers: {
          test: {
            duration: 1000,
            elapsed: 500,
            isRunning: false,
            isLooping: true
          }
        }
      };

      timer.deserialize(data);
      const result = timer.getTimer('test');
      
      expect(result).toBeDefined();
      expect(result.duration).toBe(1000);
      expect(result.elapsed).toBe(500);
      expect(result.isRunning).toBe(false);
      expect(result.isLooping).toBe(true);
    });

    test('deserializes running timer with correct start time', () => {
      currentTime = 1000;
      
      const data = {
        timers: {
          test: {
            duration: 1000,
            elapsed: 500,
            isRunning: true,
            isLooping: false
          }
        }
      };

      timer.deserialize(data);
      const result = timer.getTimer('test');
      
      expect(result.startTime).toBe(500); // currentTime - elapsed
    });

    test('deserializes with missing data using defaults', () => {
      timer.deserialize({});
      expect(timer.serialize().timers).toEqual({});
    });
  });
});