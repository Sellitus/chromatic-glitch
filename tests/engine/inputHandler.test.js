/**
 * Input handler tests
 */
import InputHandler from '../../src/js/engine/inputHandler';

describe('InputHandler', () => {
  let inputHandler;
  let mockTarget;

  beforeEach(() => {
    // Create mock target element for event handlers
    mockTarget = document.createElement('div');
    mockTarget.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 100,
      top: 100
    });

    // Create new input handler instance
    inputHandler = new InputHandler();
    inputHandler.init(mockTarget);
  });

  afterEach(() => {
    if (inputHandler) {
      inputHandler.destroy();
    }
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('initializes with empty state', () => {
      const newHandler = new InputHandler(); // Test uninitiated state
      expect(newHandler.pressedKeys.size).toBe(0);
      expect(newHandler.mousePosition).toEqual({ x: 0, y: 0 });
      expect(newHandler.mouseButtons.size).toBe(0);
    });

    test('attaches event listeners on init', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const targetAddEventListenerSpy = jest.spyOn(mockTarget, 'addEventListener');

      const newHandler = new InputHandler();
      newHandler.init(mockTarget);

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
      expect(targetAddEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(targetAddEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(targetAddEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));

      newHandler.destroy();
    });

    test('removes event listeners on destroy', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const targetRemoveEventListenerSpy = jest.spyOn(mockTarget, 'removeEventListener');

      // Use our already initialized handler from beforeEach
      inputHandler.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
      expect(targetRemoveEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(targetRemoveEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(targetRemoveEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });
  });

  describe('Keyboard Input', () => {
    test('tracks pressed keys', () => {
      const keyDownEvent = new KeyboardEvent('keydown', { code: 'Space' });
      inputHandler.handleKeyDown(keyDownEvent);
      expect(inputHandler.isKeyPressed('Space')).toBe(true);

      const keyUpEvent = new KeyboardEvent('keyup', { code: 'Space' });
      inputHandler.handleKeyUp(keyUpEvent);
      expect(inputHandler.isKeyPressed('Space')).toBe(false);
    });

    test('prevents default actions for game keys', () => {
      const gameKeys = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      const preventDefaultSpies = new Array(gameKeys.length).fill(null).map(() => jest.fn());

      gameKeys.forEach((code, index) => {
        const keyDownEvent = new KeyboardEvent('keydown', { code });
        Object.defineProperty(keyDownEvent, 'preventDefault', {
          value: preventDefaultSpies[index]
        });
        window.dispatchEvent(keyDownEvent);
      });

      preventDefaultSpies.forEach(spy => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });

    test('notifies registered listeners of key events', () => {
      const keydownCallback = jest.fn();
      const keyupCallback = jest.fn();

      inputHandler.addEventListener('keydown', keydownCallback);
      inputHandler.addEventListener('keyup', keyupCallback);

      const keyDownEvent = new KeyboardEvent('keydown', { code: 'Space' });
      inputHandler.handleKeyDown(keyDownEvent);
      expect(keydownCallback).toHaveBeenCalledWith(keyDownEvent);

      const keyUpEvent = new KeyboardEvent('keyup', { code: 'Space' });
      inputHandler.handleKeyUp(keyUpEvent);
      expect(keyupCallback).toHaveBeenCalledWith(keyUpEvent);
    });
  });

  describe('Mouse Input', () => {
    test('tracks mouse position', () => {
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 200
      });
      Object.defineProperty(mouseMoveEvent, 'target', { value: mockTarget });

      inputHandler.handleMouseMove(mouseMoveEvent);

      const position = inputHandler.getMousePosition();
      expect(position).toEqual({
        x: 50,  // 150 - mockTarget.getBoundingClientRect().left
        y: 100  // 200 - mockTarget.getBoundingClientRect().top
      });
    });

    test('tracks mouse buttons', () => {
      const mouseDownEvent = new MouseEvent('mousedown', { button: 0 });
      inputHandler.handleMouseDown(mouseDownEvent);
      expect(inputHandler.isMouseButtonPressed(0)).toBe(true);

      const mouseUpEvent = new MouseEvent('mouseup', { button: 0 });
      inputHandler.handleMouseUp(mouseUpEvent);
      expect(inputHandler.isMouseButtonPressed(0)).toBe(false);
    });

    test('notifies registered listeners of mouse events', () => {
      const mousemoveCallback = jest.fn();
      const mousedownCallback = jest.fn();
      const mouseupCallback = jest.fn();

      inputHandler.addEventListener('mousemove', mousemoveCallback);
      inputHandler.addEventListener('mousedown', mousedownCallback);
      inputHandler.addEventListener('mouseup', mouseupCallback);

      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 200
      });
      Object.defineProperty(mouseMoveEvent, 'target', { value: mockTarget });

      inputHandler.handleMouseMove(mouseMoveEvent);
      expect(mousemoveCallback).toHaveBeenCalledWith(mouseMoveEvent);

      const mouseDownEvent = new MouseEvent('mousedown', { button: 0 });
      inputHandler.handleMouseDown(mouseDownEvent);
      expect(mousedownCallback).toHaveBeenCalledWith(mouseDownEvent);

      const mouseUpEvent = new MouseEvent('mouseup', { button: 0 });
      inputHandler.handleMouseUp(mouseUpEvent);
      expect(mouseupCallback).toHaveBeenCalledWith(mouseUpEvent);
    });
  });

  describe('Event Listeners', () => {
    test('adds and removes event listeners', () => {
      const callback = jest.fn();
      const eventType = 'keydown';

      inputHandler.addEventListener(eventType, callback);
      expect(inputHandler.eventListeners.get(eventType).has(callback)).toBe(true);

      inputHandler.removeEventListener(eventType, callback);
      expect(inputHandler.eventListeners.get(eventType).has(callback)).toBe(false);
    });

    test('handles multiple listeners for same event type', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const eventType = 'keydown';

      inputHandler.addEventListener(eventType, callback1);
      inputHandler.addEventListener(eventType, callback2);

      const event = new KeyboardEvent('keydown', { code: 'Space' });
      inputHandler.handleKeyDown(event);

      expect(callback1).toHaveBeenCalledWith(event);
      expect(callback2).toHaveBeenCalledWith(event);
    });

    test('safely handles removing non-existent listeners', () => {
      const callback = jest.fn();
      expect(() => {
        inputHandler.removeEventListener('nonexistent', callback);
      }).not.toThrow();
    });
  });
});
