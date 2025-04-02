import BaseScreen from './BaseScreen.js';

/**
 * Manages a stack of game screens, handling transitions and lifecycle events.
 */
export default class ScreenManager {
  /**
   * @param {HTMLElement} container - The DOM element where screens will be mounted.
   * @param {BaseScreen} [initialScreen=null] - Optional initial screen to push onto the stack.
   */
  constructor(container, initialScreen = null) {
    if (!container || !(container instanceof HTMLElement)) {
      throw new Error('ScreenManager requires a valid container HTMLElement.');
    }
    this.container = container;
    this.screenStack = []; // Holds instances of BaseScreen

    if (initialScreen) {
      this.push(initialScreen);
    }
  }

  /**
   * Pushes a new screen onto the stack, making it the active screen.
   * Checks if an object looks like a valid screen instance (duck typing).
   * @param {any} obj - The object to check.
   * @returns {boolean} True if it seems like a screen instance.
   * @private
   */
  _isValidScreen(obj) {
    return obj &&
           typeof obj.onEnter === 'function' &&
           typeof obj.onExit === 'function' &&
           typeof obj.show === 'function' &&
           typeof obj.hide === 'function' &&
           typeof obj.mount === 'function' && // Added mount check
           obj.element instanceof HTMLElement; // Check for the DOM element
  }

  /**
   * Pushes a new screen onto the stack, making it the active screen.
   * @param {BaseScreen} screenInstance - The screen instance to push.
   */
  push(screenInstance) {
    // Use duck typing check instead of instanceof
    if (!this._isValidScreen(screenInstance)) {
      throw new Error('Provided object is not a valid screen instance.');
    }

    const currentScreen = this.getActiveScreen();
    if (currentScreen) {
      currentScreen.onExit();
      currentScreen.hide(); // Consider adding transition classes
    }

    // Ensure the screen knows its manager
    screenInstance.screenManager = this;

    // Mount if not already part of the DOM (or specifically, the container)
    if (!screenInstance.element || !this.container.contains(screenInstance.element)) {
      screenInstance.mount(this.container);
    }

    this.screenStack.push(screenInstance);
    screenInstance.show(); // Consider adding transition classes
    screenInstance.onEnter();
  }

  /**
   * Removes the top screen from the stack, revealing the previous one.
   * Does nothing if there's only one screen on the stack.
   */
  pop() {
    if (this.screenStack.length <= 1) {
      console.warn('ScreenManager: Cannot pop the last screen.');
      return;
    }

    const currentScreen = this.screenStack.pop();
    if (currentScreen) {
      currentScreen.onExit();
      currentScreen.hide(); // Consider transition
      // Optionally unmount or destroy the popped screen if desired
      // currentScreen.unmount(); 
    }

    const newTopScreen = this.getActiveScreen();
    if (newTopScreen) {
      newTopScreen.show(); // Consider transition
      newTopScreen.onEnter();
    }
  }

  /**
   * Replaces the current top screen with a new one.
   * @param {BaseScreen} screenInstance - The new screen instance.
   */
  replace(screenInstance) {
     // Use duck typing check instead of instanceof
     if (!this._isValidScreen(screenInstance)) {
      throw new Error('Provided object is not a valid screen instance for replacement.');
    }
     if (this.screenStack.length === 0) {
        this.push(screenInstance); // If stack is empty, just push
        return;
     }

    const currentScreen = this.screenStack.pop();
     if (currentScreen) {
        currentScreen.onExit();
        currentScreen.hide(); // Consider transition
        // Optionally unmount or destroy the replaced screen
        // currentScreen.unmount();
     }
     
     // Ensure the screen knows its manager
     screenInstance.screenManager = this;

     // Mount if not already part of the DOM
     if (!screenInstance.element || !this.container.contains(screenInstance.element)) {
        screenInstance.mount(this.container);
     }

     this.screenStack.push(screenInstance);
     screenInstance.show(); // Consider transition
     screenInstance.onEnter();
  }

  /**
   * Gets the currently active screen (top of the stack).
   * @returns {BaseScreen | null} The active screen instance or null if the stack is empty.
   */
  getActiveScreen() {
    return this.screenStack.length > 0 ? this.screenStack[this.screenStack.length - 1] : null;
  }

  /**
   * Optional update method to propagate updates to the active screen.
   * Should be called from the main game loop.
   * @param {number} deltaTime - Time elapsed since the last frame.
   */
  update(deltaTime) {
    const activeScreen = this.getActiveScreen();
    if (activeScreen && typeof activeScreen.update === 'function') {
      activeScreen.update(deltaTime);
    }
  }
}
