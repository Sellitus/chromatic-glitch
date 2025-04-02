// Get the actual BaseScreen class *before* mocking it
const BaseScreenActual = jest.requireActual('../../../src/js/ui/screens/BaseScreen.js').default;

// Mock BaseScreen entirely to isolate ScreenManager logic
jest.mock('../../../src/js/ui/screens/BaseScreen.js'); // Keep the mock declaration

// Import the mocked version AFTER the mock declaration
import BaseScreen from '../../../src/js/ui/screens/BaseScreen.js';
import ScreenManager from '../../../src/js/ui/screens/ScreenManager.js';

// Note: We configure the mock's behavior in beforeEach

// Mock console.warn
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('ScreenManager', () => {
  let container;
  let screenManager;
  let screen1;
  let screen2;
  let screen3;

  // Define the mock implementation logic here to be used in beforeEach
  const mockBaseScreenImplementation = (options = {}) => {
    const element = document.createElement('div'); // Create element here, inside the test environment
    element.id = options.id || `mock-screen-${Math.random()}`;
    element.style.display = 'none'; // Start hidden

    const instance = {
        id: options.id || element.id,
        element: element,
        screenManager: null, // Will be set by ScreenManager
        // Mock methods we need to track
        mount: jest.fn((container) => {
            if (!container.contains(instance.element)) {
                container.appendChild(instance.element);
            }
        }),
        unmount: jest.fn(() => {
            if (instance.element.parentNode) {
                instance.element.parentNode.removeChild(instance.element);
            }
        }),
        onEnter: jest.fn(),
        onExit: jest.fn(),
        show: jest.fn(() => { instance.element.style.display = ''; }),
        hide: jest.fn(() => { instance.element.style.display = 'none'; }),
        update: jest.fn(),
    };
    // Try to make the mock instance pass instanceof checks against the *actual* BaseScreen
    Object.setPrototypeOf(instance, BaseScreenActual.prototype);
    return instance;
  };


  beforeEach(() => {
    // Apply the mock implementation logic
    BaseScreen.mockImplementation(mockBaseScreenImplementation);
    // Clear the mock constructor calls and instance method calls before each test
    BaseScreen.mockClear();
    consoleWarnSpy.mockClear();

    // Create a container element for mounting screens
    container = document.createElement('div');
    document.body.appendChild(container); // Add to DOM for contains checks

    // Create mock screen instances *after* applying the mock implementation
    screen1 = new BaseScreen({ id: 'screen1' });
    screen2 = new BaseScreen({ id: 'screen2' });
    screen3 = new BaseScreen({ id: 'screen3' });

    // Reset mocks on instances created *before* the manager
    [screen1, screen2, screen3].forEach(s => {
        Object.values(s).forEach(prop => {
            if (jest.isMockFunction(prop)) {
                prop.mockClear();
            }
        });
    });

    // Initialize ScreenManager *without* an initial screen for most tests
    screenManager = new ScreenManager(container);
  });

  afterEach(() => {
    // Clean up the container from the DOM
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    container = null;
    // Clear mock implementation details if necessary between tests
    BaseScreen.mockClear();
  });

  afterAll(() => {
      consoleWarnSpy.mockRestore();
      jest.restoreAllMocks(); // Restore all mocks, including BaseScreen
  });

  test('should throw error if container is invalid', () => {
    expect(() => new ScreenManager(null)).toThrow('ScreenManager requires a valid container HTMLElement.');
    expect(() => new ScreenManager({})).toThrow('ScreenManager requires a valid container HTMLElement.');
  });

  test('should initialize with an empty stack', () => {
    expect(screenManager.screenStack).toEqual([]);
    expect(screenManager.getActiveScreen()).toBeNull();
  });

  test('should initialize with an initial screen if provided', () => {
      const initialScreen = new BaseScreen({ id: 'initial' });
      // Reset mocks for this specific instance
      Object.values(initialScreen).forEach(prop => jest.isMockFunction(prop) && prop.mockClear());

      const managerWithInitial = new ScreenManager(container, initialScreen);

      expect(managerWithInitial.screenStack).toHaveLength(1);
      expect(managerWithInitial.getActiveScreen()).toBe(initialScreen);
      expect(initialScreen.mount).toHaveBeenCalledWith(container);
      expect(initialScreen.show).toHaveBeenCalled();
      expect(initialScreen.onEnter).toHaveBeenCalled();
      expect(initialScreen.screenManager).toBe(managerWithInitial);
  });

  test('push should add a screen to the stack', () => {
    screenManager.push(screen1);
    expect(screenManager.screenStack).toEqual([screen1]);
    expect(screenManager.getActiveScreen()).toBe(screen1);
  });

  test('push should mount, show, and call onEnter for the new screen', () => {
    screenManager.push(screen1);
    expect(screen1.mount).toHaveBeenCalledWith(container);
    expect(screen1.show).toHaveBeenCalled();
    expect(screen1.onEnter).toHaveBeenCalled();
    expect(screen1.screenManager).toBe(screenManager); // Ensure manager reference is set
  });

  test('push should hide and call onExit for the previous screen', () => {
    screenManager.push(screen1);
    screenManager.push(screen2);

    expect(screen1.onExit).toHaveBeenCalled();
    expect(screen1.hide).toHaveBeenCalled();
    expect(screen2.onEnter).toHaveBeenCalled();
    expect(screen2.show).toHaveBeenCalled();
    expect(screenManager.getActiveScreen()).toBe(screen2);
  });

  test('push should not remount if screen element is already in container', () => {
      // Manually add screen1 to container first
      screen1.mount(container);
      screen1.mount.mockClear(); // Clear the manual call

      screenManager.push(screen1);
      expect(screen1.mount).not.toHaveBeenCalled(); // Should not call mount again
      expect(screen1.show).toHaveBeenCalled();
      expect(screen1.onEnter).toHaveBeenCalled();
  });

  test('push should throw error for non-valid screen instances', () => {
    // Need to bypass the mock for this check
    BaseScreen.mockImplementation(() => ({})); // Make it return a plain object
    // Expect the new error message from the duck typing check
    expect(() => screenManager.push({})).toThrow('Provided object is not a valid screen instance.');
    // Restore mock for subsequent tests
    BaseScreen.mockImplementation(mockBaseScreenImplementation);
  });


  test('pop should remove the top screen', () => {
    screenManager.push(screen1);
    screenManager.push(screen2);
    screenManager.pop();

    expect(screenManager.screenStack).toEqual([screen1]);
    expect(screenManager.getActiveScreen()).toBe(screen1);
  });

  test('pop should call onExit and hide for the popped screen', () => {
    screenManager.push(screen1);
    screenManager.push(screen2);
    screenManager.pop();

    expect(screen2.onExit).toHaveBeenCalled();
    expect(screen2.hide).toHaveBeenCalled();
    // Optionally check unmount if implemented in pop
    // expect(screen2.unmount).toHaveBeenCalled();
  });

  test('pop should call show and onEnter for the revealed screen', () => {
    screenManager.push(screen1);
    screenManager.push(screen2);

    // Clear initial calls from push
    screen1.show.mockClear();
    screen1.onEnter.mockClear();

    screenManager.pop();

    expect(screen1.show).toHaveBeenCalledTimes(1); // Called only when revealed by pop
    expect(screen1.onEnter).toHaveBeenCalledTimes(1); // Called only when revealed by pop
  });


  test('pop should do nothing and warn if only one screen exists', () => {
    screenManager.push(screen1);
    screenManager.pop();

    expect(screenManager.screenStack).toEqual([screen1]);
    expect(screen1.onExit).not.toHaveBeenCalled();
    expect(screen1.hide).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith('ScreenManager: Cannot pop the last screen.');
  });

  test('pop should warn if stack is empty (current behavior)', () => {
      screenManager.pop();
      expect(screenManager.screenStack).toEqual([]);
      // Current code warns because length 0 satisfies <= 1 check.
      expect(console.warn).toHaveBeenCalledWith('ScreenManager: Cannot pop the last screen.');
      // TODO: Consider changing ScreenManager.pop to NOT warn on empty stack, only on length === 1.
  });

  test('replace should swap the top screen', () => {
    screenManager.push(screen1);
    screenManager.replace(screen2);

    expect(screenManager.screenStack).toEqual([screen2]);
    expect(screenManager.getActiveScreen()).toBe(screen2);
  });

  test('replace should call onExit/hide for old screen and onEnter/show/mount for new screen', () => {
    screenManager.push(screen1);
    screenManager.replace(screen2);

    expect(screen1.onExit).toHaveBeenCalled();
    expect(screen1.hide).toHaveBeenCalled();
    // Optionally check unmount if implemented in replace
    // expect(screen1.unmount).toHaveBeenCalled();

    expect(screen2.mount).toHaveBeenCalledWith(container);
    expect(screen2.show).toHaveBeenCalled();
    expect(screen2.onEnter).toHaveBeenCalled();
    expect(screen2.screenManager).toBe(screenManager);
  });

  test('replace should just push if stack is empty', () => {
      screenManager.replace(screen1);
      expect(screenManager.screenStack).toEqual([screen1]);
      expect(screen1.mount).toHaveBeenCalledWith(container);
      expect(screen1.show).toHaveBeenCalled();
      expect(screen1.onEnter).toHaveBeenCalled();
      expect(screen1.onExit).not.toHaveBeenCalled(); // No screen to exit
  });

  test('replace should throw error for non-valid screen instances', () => {
    screenManager.push(screen1); // Need at least one screen to replace
    // Need to bypass the mock for this check
    BaseScreen.mockImplementation(() => ({})); // Make it return a plain object
    // Expect the new error message from the duck typing check
    expect(() => screenManager.replace({})).toThrow('Provided object is not a valid screen instance for replacement.');
     // Restore mock for subsequent tests
     BaseScreen.mockImplementation(mockBaseScreenImplementation);
  });

  test('update should call update on the active screen', () => {
    screenManager.push(screen1);
    screenManager.push(screen2);
    screenManager.update(16.67);

    expect(screen1.update).not.toHaveBeenCalled();
    expect(screen2.update).toHaveBeenCalledWith(16.67);
  });

  test('update should do nothing if no active screen', () => {
    expect(() => screenManager.update(16.67)).not.toThrow();
  });

  test('update should handle active screens without an update method', () => {
      const screenNoUpdate = new BaseScreen({ id: 'no-update' });
      delete screenNoUpdate.update; // Remove the method
      screenManager.push(screenNoUpdate);
      expect(() => screenManager.update(16.67)).not.toThrow();
  });
});
