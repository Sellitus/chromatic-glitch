import UIComponent from '../core/UIComponent.js';

/**
 * Base class for all game screens.
 * Extends UIComponent and adds screen-specific lifecycle methods.
 */
export default class BaseScreen extends UIComponent {
  constructor(options = {}) {
    super({ ...options, className: `screen ${options.className || ''}`.trim() });
    this.screenManager = options.screenManager || null; // Reference to the manager
  }

  /**
   * Called by the ScreenManager when this screen becomes the active screen.
   * Use this for setup specific to the screen being visible and interactive.
   */
  onEnter() {
    // Base implementation does nothing, override in subclasses
    console.log(`Entering screen: ${this.constructor.name} (${this.id})`);
  }

  /**
   * Called by the ScreenManager when this screen is no longer the active screen.
   * Use this for cleanup specific to the screen being hidden or replaced.
   */
  onExit() {
    // Base implementation does nothing, override in subclasses
    console.log(`Exiting screen: ${this.constructor.name} (${this.id})`);
  }

  /**
   * Optional update method, called by the game loop if needed.
   * @param {number} deltaTime - Time elapsed since the last frame.
   */
  update(deltaTime) {
    // Base implementation does nothing, override if per-frame updates are needed
  }

  /**
   * Renders the screen. Often, rendering is handled by child components,
   * but this can be overridden for custom screen-level rendering.
   */
  render() {
    // Base implementation relies on child components rendering themselves
  }

  // Override createElement to add a base 'screen' class
  createElement() {
    super.createElement(); // Call UIComponent's createElement
    this.element.classList.add('screen'); // Add base screen class
    // Ensure screen is hidden initially until managed by ScreenManager
    this.element.style.display = 'none'; 
  }

  // Override show/hide to potentially manage transitions later
  show() {
    this.isVisible = true;
    this.element.style.display = ''; // Or manage via CSS classes for transitions
    // Consider adding transition classes here
  }

  hide() {
    this.isVisible = false;
    this.element.style.display = 'none'; // Or manage via CSS classes for transitions
     // Consider removing/adding transition classes here
  }
}
