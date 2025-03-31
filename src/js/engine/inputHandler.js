/**
 * Manages keyboard and mouse input events
 */
export default class InputHandler {
  constructor() {
    // Track pressed keys
    this.pressedKeys = new Set();
    
    // Track mouse state
    this.mousePosition = { x: 0, y: 0 };
    this.mouseButtons = new Set();

    // Event callback storage
    this.eventListeners = new Map();

    // Bind methods to preserve this context
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.preventDefaultForGameKeys = this.preventDefaultForGameKeys.bind(this);
  }

  /**
   * Initialize input handlers
   * @param {HTMLElement} target - Element to attach listeners to
   */
  init(target) {
    this.target = target;
    
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('keydown', this.preventDefaultForGameKeys);

    // Mouse events
    this.target.addEventListener('mousemove', this.handleMouseMove);
    this.target.addEventListener('mousedown', this.handleMouseDown);
    this.target.addEventListener('mouseup', this.handleMouseUp);
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('keydown', this.preventDefaultForGameKeys);
    
    if (this.target) {
      this.target.removeEventListener('mousemove', this.handleMouseMove);
      this.target.removeEventListener('mousedown', this.handleMouseDown);
      this.target.removeEventListener('mouseup', this.handleMouseUp);
    }
  }

  /**
   * Prevent default browser actions for game keys
   * @private
   * @param {KeyboardEvent} event - Keyboard event
   */
  preventDefaultForGameKeys(event) {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
    }
  }

  /**
   * Add an event listener
   * @param {string} eventType - Type of event to listen for
   * @param {Function} callback - Function to call when event occurs
   */
  addEventListener(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType).add(callback);
  }

  /**
   * Remove an event listener
   * @param {string} eventType - Type of event to remove
   * @param {Function} callback - Function to remove
   */
  removeEventListener(eventType, callback) {
    if (this.eventListeners.has(eventType)) {
      this.eventListeners.get(eventType).delete(callback);
    }
  }

  /**
   * Check if a key is currently pressed
   * @param {string} keyCode - Key code to check
   * @returns {boolean} True if key is pressed
   */
  isKeyPressed(keyCode) {
    return this.pressedKeys.has(keyCode);
  }

  /**
   * Get current mouse position
   * @returns {{x: number, y: number}} Mouse coordinates
   */
  getMousePosition() {
    return { ...this.mousePosition };
  }

  /**
   * Check if a mouse button is pressed
   * @param {number} button - Mouse button to check
   * @returns {boolean} True if button is pressed
   */
  isMouseButtonPressed(button) {
    return this.mouseButtons.has(button);
  }

  /**
   * Handle keydown event
   * @private
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    this.pressedKeys.add(event.code);
    this.emitEvent('keydown', event);
  }

  /**
   * Handle keyup event
   * @private
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyUp(event) {
    this.pressedKeys.delete(event.code);
    this.emitEvent('keyup', event);
  }

  /**
   * Handle mousemove event
   * @private
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseMove(event) {
    const rect = event.target.getBoundingClientRect();
    this.mousePosition = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    this.emitEvent('mousemove', event);
  }

  /**
   * Handle mousedown event
   * @private
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseDown(event) {
    this.mouseButtons.add(event.button);
    this.emitEvent('mousedown', event);
  }

  /**
   * Handle mouseup event
   * @private
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseUp(event) {
    this.mouseButtons.delete(event.button);
    this.emitEvent('mouseup', event);
  }

  /**
   * Emit an event to all registered listeners
   * @private
   * @param {string} eventType - Type of event to emit
   * @param {Event} event - Event object
   */
  emitEvent(eventType, event) {
    if (this.eventListeners.has(eventType)) {
      this.eventListeners.get(eventType).forEach(callback => callback(event));
    }
  }
}
